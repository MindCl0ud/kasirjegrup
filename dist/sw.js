// KASIR JE GRUP — Service Worker v7 (Offline-First)
const CACHE_NAME = "kasir-je-grup-v7";

// File list diisi otomatis saat build oleh vite plugin
const PRECACHE_URLS = ["/","/index.html","/manifest.json","/assets/index-CJBNwjfH.js","/icons/icon-128.png","/icons/icon-144.png","/icons/icon-152.png","/icons/icon-192.png","/icons/icon-384.png","/icons/icon-512.png","/icons/icon-72.png","/icons/icon-96.png","/icons/icon.svg"];

// ── Install: cache SEMUA file app ─────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache core files
      const core = ['/', '/index.html', '/manifest.json'];
      for (const url of core) {
        try { await cache.add(new Request(url, {cache: 'reload'})); } catch {}
      }
      // Cache semua asset yang diketahui dari build
      for (const url of PRECACHE_URLS) {
        try { await cache.add(new Request(url, {cache: 'reload'})); } catch {}
      }
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: hapus cache lama ────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-first untuk aset, Network-first untuk API ────
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  
  // Skip non-GET
  if (e.request.method !== "GET") return;
  // Skip chrome extensions
  if (e.request.url.startsWith("chrome-extension")) return;
  // Skip Firebase API (harus online untuk sync)
  if (url.hostname.includes("firestore.googleapis.com") ||
      url.hostname.includes("firebase.googleapis.com") ||
      url.hostname.includes("googleapis.com") ||
      url.hostname.includes("google.com")) return;
  // Skip Google Sheets
  if (url.hostname.includes("script.google.com")) return;

  // Untuk navigasi (HTML): cache-first, fallback network
  if (e.request.mode === "navigate") {
    e.respondWith(
      caches.match('/index.html').then(cached => {
        if (cached) return cached;
        return fetch(e.request).catch(() => 
          new Response('<h1>Offline</h1><p>Buka dulu saat ada internet.</p>', 
            {headers: {'Content-Type': 'text/html'}})
        );
      })
    );
    return;
  }

  // Untuk JS/CSS/font/gambar: cache-first
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico|json)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => new Response('', {status: 503}));
      })
    );
    return;
  }

  // Default: network dulu, cache sebagai backup
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200 && res.type !== 'opaque') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
