const CACHE_NAME = 'bs-force-reset-v99';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => caches.delete(key)));
        }).then(() => self.clients.claim())
    );
});

// PASS-THROUGH ONLY: No caching, force network
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
