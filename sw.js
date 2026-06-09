const CACHE_NAME = "geoline-pro-v20260609b";

const APP_SHELL = [
  "/GEOLINE-PRO/",
  "/GEOLINE-PRO/index.html",
  "/GEOLINE-PRO/manifest.webmanifest",
  "/GEOLINE-PRO/apple-touch-icon.png",
  "/GEOLINE-PRO/favicon-32.png",
  "/GEOLINE-PRO/icon-192.jpg",
  "/GEOLINE-PRO/icon-512.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key.startsWith("geoline-pro-") && key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const accept = req.headers.get("accept") || "";

  // Network-first for HTML so GitHub updates are seen immediately.
  if (accept.includes("text/html")) {
    event.respondWith(
      fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      }).catch(() => caches.match(req).then(cached => cached || caches.match("/GEOLINE-PRO/index.html")))
    );
    return;
  }

  // Cache-first for icons/static files.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      });
    })
  );
});
