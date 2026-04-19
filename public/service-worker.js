/* service-worker.js */
const CACHE_NAME = "Hotel-cache-v24"; // <-- IMPORTANTE: Versión actualizada

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
];

const NEVER_CACHE_PREFIXES = ["/api"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("No se pudieron cachear todos los assets base:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Navegaciones (HTML)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 2. Identificar peticiones a SUPABASE o APIs dinámicas
  const isApiCall = url.hostname.includes("supabase.co") || NEVER_CACHE_PREFIXES.some(p => url.pathname.startsWith(p));

  if (isApiCall) {
    event.respondWith(
      fetch(req).catch((error) => {
        console.warn("Petición a BD bloqueada por estar offline:", req.url);
        // Devolvemos un 503 estructurado para que el cliente no explote con 'Failed to convert value to Response'
        return new Response(
          JSON.stringify({ message: "Failed to fetch", offline: true }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // 3. Archivos estáticos (Imágenes, CSS, JS) - Todo lo que no sea API y sea GET
  if (req.method === "GET") {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            // Solo cacheamos respuestas válidas
            if (networkRes && networkRes.status === 200 && (networkRes.type === "basic" || networkRes.type === "cors")) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => {
            // SI FALLA LA RED Y NO HAY CACHÉ, devolvemos un Response de error para evitar el pantallazo
            return cached || new Response("Recurso no disponible offline", { status: 503 });
          });

        return cached || fetchPromise;
      })
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SW_SKIP_WAITING") {
    self.skipWaiting();
  }
});