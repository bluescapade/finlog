-- Money Log: cloud setup
-- Paste all of this into Supabase > SQL Editor > New query, then press Run.
-- Safe to run more than once.

-- 1. Every expense, money in, piggy, card etc. is one row here.
create table if not exists public.items (
  user_id    uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text    not null,
  id         text    not null,
  data       jsonb,
  deleted    boolean not null default false,
  updated_at bigint  not null,              -- when you changed it (on your phone)
  server_at  timestamptz not null default now(), -- when the cloud got it
  primary key (user_id, kind, id)
);
create index if not exists items_pull on public.items (user_id, server_at);

-- 2. Daily snapshots of everything, so you can roll back.
create table if not exists public.snapshots (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  device     text,
  note       text,
  data       jsonb not null
);
create index if not exists snapshots_user on public.snapshots (user_id, created_at desc);

-- 3. The newer change always wins, even if an older one arrives later.
create or replace function public.items_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;            -- keep the newer version that's already here
  end if;
  new.server_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists items_guard on public.items;
create trigger items_guard before insert or update on public.items
  for each row execute function public.items_guard();

-- 4. Only you can see or change your own rows.
alter table public.items     enable row level security;
alter table public.snapshots enable row level security;

drop policy if exists "own items" on public.items;
create policy "own items" on public.items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own snapshots" on public.snapshots;
create policy "own snapshots" on public.snapshots for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 5. Let logged-in users reach the tables (logged-out visitors get nothing).
revoke all on public.items, public.snapshots from anon;
grant select, insert, update, delete on public.items, public.snapshots to authenticated;
grant usage, select on all sequences in schema public to authenticated;
