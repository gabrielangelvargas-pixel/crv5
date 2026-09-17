const CACHE_NAME = 'crv5-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
