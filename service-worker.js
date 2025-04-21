const CACHE_NAME = "appliance-pwa-cache-v1";
const urlsToCache = [
  "/index.html",
  "/manifest.json",
  "/service-worker.js",
  "/icon.png"
  // In a real app, also cache any other necessary assets like CSS or perhaps the data lists if external.
];

// Install event - cache app shell files
self.addEventListener('install', event => {
  console.log("[ServiceWorker] Installing and caching app shell...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - cleanup old caches if any
self.addEventListener('activate', event => {
  console.log("[ServiceWorker] Activating new service worker...");
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log("[ServiceWorker] Removing old cache:", key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Claim control so the SW starts controlling clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache if available, otherwise fetch from network and cache it
self.addEventListener('fetch', event => {
  // Only handle GET requests (skip POST from forms etc., though our app is mostly GET)
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }
      // Not in cache, attempt network
      return fetch(event.request).then(networkResponse => {
        // If the request is for an asset within our app scope, cache it for next time
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fetch fails (offline and not in cache)
        // Optionally, return a fallback page or image if applicable.
        return new Response("Offline"); // simple fallback text or could be an offline.html page
      });
    })
  );
});
