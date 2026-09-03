const CACHE_NAME = 'luma-branding-v3';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './photobranding_logo2.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache each file individually so one missing/failed asset
      // doesn't reject the whole install (unlike cache.addAll).
      return Promise.all(
        FILES_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('SW: failed to cache', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Got a fresh copy from the network — save it to the cache
        // so it's available next time we're offline.
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // No internet — fall back to whatever we have cached.
        return caches.match(event.request);
      })
  );
});
