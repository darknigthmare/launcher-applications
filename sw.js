const CACHE_PREFIX = "launcher-";
const CACHE_NAME = "launcher-shell-v13";
const RUNTIME_CACHE = "launcher-media-runtime-v1";
const MAX_RUNTIME_ENTRIES = 120;
const APP_SHELL = [
  "/index.html",
  "/manifest.webmanifest",
  "/assets/launcher-icon.svg",
  "/assets/launcher-icon-192.png",
  "/assets/launcher-icon-512.png",
  "/assets/apple-touch-icon.png",
  "/assets/app-icons.svg",
  "/assets/app-gallery.json",
  "/assets/social-features.css",
  "/assets/social-features.js"
];

function isCacheableResponse(response, expectedContentType = "") {
  const contentType = response.headers.get("content-type") || "";
  return response.ok
    && !response.redirected
    && response.type === "basic"
    && (!expectedContentType || contentType.includes(expectedContentType));
}

async function storeRuntimeMedia(request, response) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response);
  const keys = await cache.keys();
  const overflow = keys.length - MAX_RUNTIME_ENTRIES;
  if (overflow > 0) {
    await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && ![CACHE_NAME, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    const networkResponse = fetch(request);
    const updatePromise = networkResponse
      .then((response) => {
        if (!isCacheableResponse(response, "text/html")) return;
        return caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", response.clone()));
      })
      .catch(() => undefined);

    event.waitUntil(updatePromise);
    event.respondWith(networkResponse.catch(() => caches.match("/index.html")));
    return;
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  if (/^\/assets\/(?:previews|presentations|screenshots)\//.test(url.pathname)) {
    const networkResponse = fetch(request);
    const updatePromise = networkResponse
      .then((response) => {
        if (!isCacheableResponse(response, "image/")) return;
        return storeRuntimeMedia(request, response.clone());
      })
      .catch(() => undefined);

    event.waitUntil(updatePromise);
    event.respondWith(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.match(request))
        .then((cached) => cached || networkResponse)
    );
    return;
  }
});
