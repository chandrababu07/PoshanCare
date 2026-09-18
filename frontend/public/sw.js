/**
 * PoshanCare Production Service Worker
 * 
 * STRICT PRIVACY & DATA INTEGRITY POLICY:
 * - Only public static shell assets (HTML, JS, CSS, fonts, public icons, manifest)
 *   are stored in Cache Storage.
 * - ALL authenticated and health API endpoints (/api/*) are strictly NETWORK-ONLY
 *   and NEVER CACHED under any circumstance.
 * - Navigation requests use Network-First and fallback to /index.html ONLY if offline.
 * - No user-specific, clinical, or session data ever enters Cache Storage.
 */

const CACHE_NAME = "poshancare-v1-static";

const STATIC_PRECACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// File extensions eligible for static cache
const STATIC_ASSET_EXTENSIONS = [
  ".js",
  ".css",
  ".woff",
  ".woff2",
  ".ttf",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".ico",
];

// 1. Install Event — Pre-cache Application Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event — Clean up obsolete cache versions & claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[Service Worker] Purging obsolete cache:", name);
              return caches.delete(name);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Message Event — Support manual update triggers and session purge
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Purge any non-static cache when user logs out or switches accounts
  if (event.data.type === "PURGE_USER_DATA") {
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return null;
        })
      );
    });
  }
});

// 4. Fetch Event — Network-First for navigation; Stale-While-Revalidate for static assets; ZERO cache for API
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // STRICT PRIVACY RULE: All API endpoints (/api/*) MUST bypass cache completely
  if (url.pathname.startsWith("/api/")) {
    return; // Standard network fetch, no Service Worker cache interception
  }

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // Only cache same-origin assets
  if (url.origin !== self.location.origin) {
    return;
  }

  // A. SPA Navigation Requests (e.g. visiting /diary, /goals, /settings)
  // Network-First: Always fetch fresh HTML when online, fallback to cached /index.html when offline.
  // We NEVER cache the route path itself (e.g. /diary) in Cache Storage.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html").then((fallback) => {
          return fallback || new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
    );
    return;
  }

  // B. Static Assets (JS, CSS, fonts, public icons, images)
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.svg" ||
    url.pathname === "/manifest.json" ||
    STATIC_ASSET_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              // Safety check: NEVER cache JSON responses or API payloads
              const contentType = networkResponse.headers.get("content-type") || "";
              if (!contentType.includes("application/json")) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
            }
            return networkResponse;
          })
          .catch(() => {
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
