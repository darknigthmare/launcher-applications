const CACHE_NAME = "launcher-shell-v8";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/launcher-icon.svg",
  "/assets/app-icons.svg",
  "/assets/app-gallery.json",
  "/assets/social-features.css",
  "/assets/social-features.js",
  "/assets/presentations/adhd-rpg.png",
  "/assets/presentations/apertire-enrichment-os.png",
  "/assets/presentations/budgetia.png",
  "/assets/presentations/cainos.png",
  "/assets/presentations/can-i-eat-it.png",
  "/assets/presentations/chroma-forge.png",
  "/assets/presentations/combine-administrator-simulator.png",
  "/assets/presentations/fossil-frontier.png",
  "/assets/presentations/genomescan-bioarena.png",
  "/assets/presentations/hellbound-hotel-manager.png",
  "/assets/presentations/iron-tempest.png",
  "/assets/presentations/jigsaw-mastermind.png",
  "/assets/presentations/jurassic-arsenal.png",
  "/assets/presentations/la-petite-fiole.png",
  "/assets/presentations/manga-finder.png",
  "/assets/presentations/media-gatherer.png",
  "/assets/presentations/multiverse-breach.png",
  "/assets/presentations/ragtime-rumble.png",
  "/assets/presentations/sg2d-expedition.png",
  "/assets/presentations/shadow-codec-ops.png",
  "/assets/presentations/snail-dette-immortelle.png",
  "/assets/presentations/spinframe.png",
  "/assets/presentations/triarche-ciel-rouge.png",
  "/assets/presentations/umbrella-hive-manager.png",
  "/assets/presentations/vortex-command.png",
  "/assets/presentations/xenomorph-tamagotchi.png",
  "/assets/presentations/xion-operator-node.png",
  "/assets/presentations/yautja-la-longue-chasse.png",
  "/assets/presentations/yomi-no-kage.png",
  "/assets/previews/adhd-rpg.png",
  "/assets/previews/another-day-z.png",
  "/assets/previews/apertire-enrichment-os.png",
  "/assets/previews/budgetia.png",
  "/assets/previews/cainos.png",
  "/assets/previews/can-i-eat-it.png",
  "/assets/previews/chroma-forge.png",
  "/assets/previews/combine-administrator-simulator.png",
  "/assets/previews/fossil-frontier.png",
  "/assets/previews/genomescan-bioarena.png",
  "/assets/previews/hellbound-hotel-manager.png",
  "/assets/previews/hive-ascension.png",
  "/assets/previews/iron-tempest.png",
  "/assets/previews/jigsaw-mastermind.png",
  "/assets/previews/jurassic-arsenal.png",
  "/assets/previews/kaiju-rupture.png",
  "/assets/previews/la-petite-fiole.png",
  "/assets/previews/manga-finder.png",
  "/assets/previews/media-gatherer.png",
  "/assets/previews/multiverse-breach.png",
  "/assets/previews/ragtime-rumble.png",
  "/assets/previews/sg2d-expedition.png",
  "/assets/previews/shadow-codec-ops.png",
  "/assets/previews/snail-dette-immortelle.png",
  "/assets/previews/spinframe.png",
  "/assets/previews/triarche-ciel-rouge.png",
  "/assets/previews/umbrella-hive-manager.png",
  "/assets/previews/vortex-command.png",
  "/assets/previews/xenomorph-tamagotchi.png",
  "/assets/previews/xion-operator-node.png",
  "/assets/previews/yautja-la-longue-chasse.png",
  "/assets/previews/yomi-no-kage.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }))
  );
});
