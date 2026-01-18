// Service Worker that aggressively prevents caching of old files
const CACHE_NAME = 'bbq-app-v2-' + Date.now();

// List of old file hashes that should NEVER be cached
const OLD_FILE_HASHES = ['540phKS2', 'DqWkFp0h', 'Bmw3L13I'];

self.addEventListener('install', (event) => {
  // Skip waiting and activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    // Delete all old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Check if this is an old file that should be blocked
  const isOldFile = OLD_FILE_HASHES.some((hash) => url.includes(hash));
  
  if (isOldFile) {
    console.error('BLOCKING old cached file:', url);
    // Return a network error to force reload
    event.respondWith(
      new Response('Old cached file blocked', {
        status: 404,
        statusText: 'Not Found'
      })
    );
    return;
  }
  
  // For index.html, always fetch from network to avoid cache
  if (url.includes('index.html') || url.endsWith('/') || url.endsWith('/bbq')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // Don't cache index.html
          return response;
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other files, try network first, then cache
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        // Only cache if it's not an old file
        const isOld = OLD_FILE_HASHES.some((hash) => url.includes(hash));
        if (!isOld && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
