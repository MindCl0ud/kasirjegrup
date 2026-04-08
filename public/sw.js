// KASIR JE GRUP — Service Worker v6
const CACHE_NAME = "kasir-je-grup-v6.8";

// On install: skip waiting immediately so new SW activates right away
self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

// On activate: delete ALL old caches, then claim clients
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for JS/CSS (always fresh), cache for static assets
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.startsWith("chrome-extension")) return;
  if (e.request.url.includes("firestore.googleapis.com")) return;
  if (e.request.url.includes("firebase")) return;
  if (e.request.url.includes("googleapis.com")) return;

  // JS/CSS: always from network (never stale)
  const url = new URL(e.request.url);
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // HTML: network-first
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Everything else: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== "opaque") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => new Response("Offline", {status:503}));
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
