const CACHE_NAME = 'helix-cache-v1';
const SHELL_CACHE = 'helix-shell-v1';
const API_CACHE = 'helix-api-v1';
const STATIC_CACHE = 'helix-static-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(['./', './index.html', './manifest.json'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (k) => k !== SHELL_CACHE && k !== API_CACHE && k !== STATIC_CACHE
          )
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Never cache non-GET requests (orders, payments, settings, etc.).
  if (request.method !== 'GET') return;

  // API data: network-first so data stays fresh when online, but we serve the
  // last known response when offline.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || new Response('', { status: 503 }))
        )
    );
    return;
  }

  // App shell: network-first, fall back to cached index.
  if (request.mode === 'navigate' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() =>
          caches
            .match('./index.html')
            .then((cached) => cached || caches.match('./'))
        )
    );
    return;
  }

  // Hashed/static assets (JS/CSS/images): cache-first.
  if (
    url.pathname.includes('/assets/') ||
    /\.(png|jpe?g|gif|svg|ico|woff2?|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }
});