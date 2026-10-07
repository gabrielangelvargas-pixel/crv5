// v2 drops the v1 cache, which could hold API responses with session data.
const CACHE_NAME = "crv4-static-v2";
const STATIC_ASSETS = ["/icons/crv4-logo-final-192.png", "/icons/crv4-logo-final-512.png"];
const MAX_ENTRIES = 200;
const OFFLINE_HTML =
  '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión | CRV4</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div><h1>Sin conexión</h1><p>Revisá tu conexión a internet y volvé a intentar.</p></div></body></html>';

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

async function trimCache(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((key) => cache.delete(key)));
}

async function fetchAndStore(cache, request) {
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    void trimCache(cache);
  }
  return response;
}

// Build chunks are content-hashed, so a cached copy is always valid.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match(request)) ?? fetchAndStore(cache, request);
}

// Images can be replaced under the same name (product uploads), so refresh in the background.
async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  const network = fetchAndStore(cache, event.request);
  if (!cached) return network;
  event.waitUntil(network.catch(() => undefined));
  return cached;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () => new Response(OFFLINE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }),
      ),
    );
    return;
  }

  // API responses (session, cart, notifications) and anything personalized never touch Cache Storage.
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
