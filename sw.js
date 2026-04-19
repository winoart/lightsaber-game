const CACHE_NAME = 'neon-saber-v1';
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
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
