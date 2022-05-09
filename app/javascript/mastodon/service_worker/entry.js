import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { handleNotificationClick, handlePush } from './web_push_notifications';

function openWebCache() {
  return caches.open('mastodon-web');
}

function fetchRoot() {
  return fetch('/', { credentials: 'include', redirect: 'manual' });
}

precacheAndRoute(self.__WB_MANIFEST);
registerRoute(/\/emoji\/1f602\.svg$/, new CacheFirst());
registerRoute(/\/emoji\/sheet_10\.png$/, new CacheFirst());
registerRoute(/locale_.*\.js$/, new CacheFirst());
registerRoute(/.*_locale_.*\.js$/, new CacheFirst());
registerRoute(/\.woff2$/, new CacheFirst());
registerRoute(/\.(?:jpe?g|png|svg)$/, new CacheFirst());
registerRoute(/\.(?:mp3|ogg)$/, new CacheFirst());

// Cause a new version of a registered Service Worker to replace an existing one
// that is already installed, and replace the currently active worker on open pages.
self.addEventListener('install', function(event) {
  event.waitUntil(Promise.all([openWebCache(), fetchRoot()]).then(([cache, root]) => cache.put('/', root)));
});
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/web/')) {
    const asyncResponse = fetchRoot();
    const asyncCache = openWebCache();

    event.respondWith(asyncResponse.then(
      response => {
        const clonedResponse = response.clone();
        asyncCache.then(cache => cache.put('/', clonedResponse)).catch();
        return response;
      },
      () => asyncCache.then(cache => cache.match('/'))));
  } else if (url.pathname === '/auth/sign_out') {
    const asyncResponse = fetch(event.request);
    const asyncCache = openWebCache();

    event.respondWith(asyncResponse.then(response => {
      if (response.ok || response.type === 'opaqueredirect') {
        return Promise.all([
          asyncCache.then(cache => cache.delete('/')),
          indexedDB.deleteDatabase('mastodon'),
        ]).then(() => response);
      }

      return response;
    }));
  }
});
self.addEventListener('push', handlePush);
self.addEventListener('notificationclick', handleNotificationClick);
