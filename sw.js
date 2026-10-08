/* Money Log offline helper: keeps the app on the phone so it opens with no internet.
   Bump VERSION whenever index.html changes so phones pick up the update. */
const VERSION='moneylog-v12';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(/supabase\.(co|in)$/.test(url.hostname)||url.pathname.startsWith('/auth/')||url.pathname.startsWith('/rest/'))return; // cloud calls always go live
  if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){   // fonts: cache first
    e.respondWith(caches.open(VERSION+'-fonts').then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{c.put(req,r.clone());return r;}))));return;
  }
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){   // the app page: network first, fall back to the saved copy when offline
    const live=fetch(req).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put('./index.html',cp));return r;});
    const slow=new Promise((ok,no)=>setTimeout(()=>caches.match('./index.html',{ignoreSearch:true}).then(h=>h?ok(h):no()),4000));
    e.respondWith(Promise.any([live,slow]).catch(()=>caches.match('./index.html',{ignoreSearch:true})));return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp));}return r;})));
});
