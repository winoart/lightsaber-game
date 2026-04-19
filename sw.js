const CACHE_NAME = 'neon-saber-v2'; // Updated version
const ASSETS = [
  'index.html',
  'style.css',
  'manifest.json',
  'src/game.js',
  'src/entities.js',
  'src/input.js',
  'src/utilities.js'
];

self.addEventListener('install', (e) => {
  // Force update the new service worker
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  // Clear old caches
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
