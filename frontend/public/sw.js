const CACHE_VERSION = 'frens-assets-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v1...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip API requests, Supabase, and Sentry
  if (
    url.pathname.startsWith('/api') || 
    url.hostname.includes('supabase') ||
    url.hostname.includes('sentry') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  // Vite Dev Server / HMR bypass (optional, but helpful if not using Bypass for Network)
  // We'll still try to cache standard assets (images, fonts)
  const isAsset = url.pathname.match(/\.(png|jpe?g|avif|webp|svg|woff2?|css)$/) || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (!isAsset) {
    // If it's not a clear static asset, just fetch it normally to avoid breaking React Router or Vite HMR
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Cache Hit:', url.pathname);
        return cachedResponse;
      }
      
      console.log('[SW] Cache Miss:', url.pathname);
      return fetch(event.request).then((networkResponse) => {
        // Cache valid responses (200) or opaque responses (0) from CDNs (like fonts)
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.error('[SW] Fetch failed:', err);
      });
    })
  );
});
