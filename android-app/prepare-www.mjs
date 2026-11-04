// Copies the web app (one index.html + icons) into www/ so it ships inside the APK.
import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of files) copyFileSync('../' + f, 'www/' + f);
console.log('www ready:', files.length, 'files');
