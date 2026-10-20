/* Service worker: guarda o "esqueleto" do site para abrir rápido e offline */
const CACHE = 'avenida-v3';
const FILES = ['./', 'index.html', 'css/styles.css', 'js/core.js', 'js/data.js', 'js/payment.js', 'js/shop.js', 'js/admin.js', 'js/admin2.js', 'js/app.js', 'manifest.json', 'assets/logo.png', 'assets/hero.png', 'assets/icon-192.png', 'assets/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('index.html'))));
});
