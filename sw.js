const CACHE='lantern-key-v3-1-20261010';
const ASSETS=['./','./index.html','./logic.js','./game.js','./style.css','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/tavern.svg','./assets/passage.svg','./assets/vault.svg','./assets/forest.svg','./assets/crossing.svg','./assets/village.svg','./assets/arcane.svg','./assets/summit.svg','./assets/campfire.svg','./assets/waycross.svg','./assets/moor.svg','./assets/fen.svg','./assets/harbor.svg','./assets/archive2.svg','./assets/citadel.svg','./assets/worldheart.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lantern-key-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 const u=new URL(e.request.url),critical=e.request.mode==='navigate'||/\.(?:js|css|html)$/.test(u.pathname);
 if(critical){e.respondWith(fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return response;}).catch(()=>caches.match(e.request)));return;}
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return response;})));
});
