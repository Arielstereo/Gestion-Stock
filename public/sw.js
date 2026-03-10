const CACHE_NAME = "tredi-stock-v1";
const STATIC_ASSETS = ["/", "/stockEntry"];

// Instalar: cachear las rutas principales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch: network first, fallback a cache
self.addEventListener("fetch", (event) => {
  // No interceptar requests a la API ni a MongoDB
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Guardar copia en cache si es una navegación
        if (event.request.mode === "navigate") {
          const clone = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});
