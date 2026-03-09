// ═══════════════════════════════════════════════
//  KASIR JE GRUP — Service Worker
//  Caches everything for 100% offline use
// ═══════════════════════════════════════════════

const CACHE_NAME = "kasir-je-grup-v3";
const OFFLINE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Face-API model files to pre-cache (downloaded by setup script)
const MODEL_FILES = [
  "/models/tiny_face_detector_model-weights_manifest.json",
  "/models/tiny_face_detector_model-shard1",
  "/models/face_landmark_68_tiny_model-weights_manifest.json",
  "/models/face_landmark_68_tiny_model-shard1",
  "/models/face_recognition_model-weights_manifest.json",
  "/models/face_recognition_model-shard1",
  "/models/face_recognition_model-shard2",
  "/models/face-api.js",
];

// ── Install: cache core assets ───────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache offline URLs (non-fatal)
      await cache.addAll(OFFLINE_URLS).catch(() => {});
      // Try to cache model files (may not exist yet)
      for (const url of MODEL_FILES) {
        await cache.add(url).catch(() => {});
      }
      return self.skipWaiting();
    })
  );
});

// ── Activate: clean old caches ───────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first strategy ──────────────
self.addEventListener("fetch", (event) => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension")) return;

  // For Google Sheets API calls — network only (graceful fail)
  if (event.request.url.includes("script.google.com")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // For Google Fonts / CDN (cache if available, skip if offline)
  if (
    event.request.url.includes("fonts.googleapis.com") ||
    event.request.url.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => new Response("", { status: 503 }));
        })
      )
    );
    return;
  }

  // Default: Cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, toCache);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// ── Background sync (optional) ───────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CACHE_MODEL_FILES") {
    caches.open(CACHE_NAME).then((cache) => {
      MODEL_FILES.forEach((url) => cache.add(url).catch(() => {}));
    });
  }
});
