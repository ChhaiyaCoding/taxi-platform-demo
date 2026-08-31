// Minimal offline cache for the Tabi PWA app shell.
//
// Flutter's own bundled service worker (flutter_service_worker.js) is
// deprecated and opt-in only as of this Flutter version — see
// https://github.com/flutter/flutter/issues/156910. This is a small,
// framework-independent replacement: stale-while-revalidate for every GET,
// so a customer who has opened the app once can still see it (and any
// already-loaded ticket) with no network.
//
// Bump CACHE_NAME on a deploy that must force every client to drop its
// cached shell — old caches are deleted on activate.
const CACHE_NAME = 'tabi-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
