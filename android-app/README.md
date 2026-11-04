# Money Log Android app

The Android app is the same `index.html` packed inside an APK with Capacitor.
Nothing here needs to be run by hand: the **Build Android App** GitHub Action
(`.github/workflows/android.yml`) builds and signs the APK and attaches it to a
GitHub Release named `android-v<APP_VERSION>`.

- Runs on every push to `main` that changes `index.html` or this folder, or by hand from the Actions tab.
- Signing key: made by the first build and saved as `signing/moneylog.p12.enc`, encrypted
  (AES-256, PBKDF2 600k) with the repo secret `ANDROID_KEY_PASSWORD`, which only the owner knows.
  Never commit an unencrypted keystore. Updates only install over the old app when signed with the
  same key; if the password is ever lost, delete the .enc file, set a new secret, rebuild, and
  uninstall/reinstall the app (data comes back through sync).
- Icons and splash come from `assets/`.
- App-only code in `index.html` is guarded by `NATIVE` (back button, status bar icons, saving files through the share sheet, daily update check).
