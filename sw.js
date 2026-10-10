const CACHE = 'lantern-key-v2-2-20261010';
const ASSETS = ['./', './index.html', './style.css', './game.js', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/tavern.svg', './assets/passage.svg', './assets/vault.svg', './assets/forest.svg', './assets/crossing.svg', './assets/village.svg', './assets/arcane.svg', './assets/summit.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('lantern-key-') && k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('message', e => { if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
 if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
 e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
