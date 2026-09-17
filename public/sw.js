const CACHE_NAME = 'crv5-shell-v4';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([
    '/',
    '/styles.css',
    '/app.js',
    '/manifest.webmanifest',
    '/icons/crv4-192.png',
    '/icons/crv4-512.png',
    '/icons/favicon-32.png',
    '/icons/apple-touch-icon.png',
  ])).then(() => self.skipWaiting()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    if (event.request.mode === 'navigate') {
      event.respondWith(fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
        return response;
      }).catch(() => caches.match('/')));
      return;
    }
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
