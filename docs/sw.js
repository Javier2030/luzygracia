/* Luz y Gracia — service worker.
   Estrategia: red primero, caché como respaldo. Un catálogo con precios NO puede
   servirse de una copia vieja; la caché está para que la app abra sin señal. */
const CACHE = "lg-v1";
const BASE = [
  "/", "/ropa-cristiana.html", "/biblias.html", "/biblioteca.html",
  "/img/app/icon-192.png", "/img/logo.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // nada de terceros
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("/")))
  );
});
