/**
 * Armsforge Service Worker - Advanced Caching Strategy
 * Optimized for performance and offline functionality
 */

const CACHE_NAME = 'armsforge-v1.2.0';
const RUNTIME_CACHE = 'armsforge-runtime';

// Resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/critical.css',
  '/css/deferred.css',
  '/css/components.css',
  '/js/core.js',
  '/js/modules.js',
  '/favicon.svg'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  pages: 'staleWhileRevalidate',
  styles: 'cacheFirst',
  scripts: 'cacheFirst',
  images: 'cacheFirst',
  fonts: 'cacheFirst',
  api: 'networkFirst'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  pages: 86400,     // 24 hours
  styles: 604800,   // 7 days
  scripts: 604800,  // 7 days
  images: 2592000,  // 30 days
  fonts: 2592000,   // 30 days
  api: 300          // 5 minutes
};

// Install event - precache critical resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Precaching critical resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Precaching failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('armsforge-') &&
                     cacheName !== CACHE_NAME &&
                     cacheName !== RUNTIME_CACHE;
            })
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except fonts and images)
  if (url.origin !== self.location.origin &&
      !isFont(request) &&
      !isImage(request)) {
    return;
  }

  event.respondWith(handleFetch(request));
});

/**
 * Handle fetch requests with appropriate caching strategy
 */
async function handleFetch(request) {
  const url = new URL(request.url);
  const resourceType = getResourceType(request);
  const strategy = CACHE_STRATEGIES[resourceType];

  try {
    switch (strategy) {
      case 'cacheFirst':
        return await cacheFirst(request);
      case 'networkFirst':
        return await networkFirst(request);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request);
      default:
        return await fetch(request);
    }
  } catch (error) {
    console.error('Fetch failed:', error);
    return await handleFetchError(request, resourceType);
  }
}

/**
 * Cache First strategy - check cache first, fallback to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cached response is still fresh
    const cacheTime = getCacheTime(cachedResponse);
    const resourceType = getResourceType(request);
    const maxAge = CACHE_DURATIONS[resourceType] * 1000;

    if (Date.now() - cacheTime < maxAge) {
      return cachedResponse;
    }
  }

  // Fetch from network and cache
  const response = await fetch(request);
  await cacheResponse(request, response.clone());
  return response;
}

/**
 * Network First strategy - try network first, fallback to cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Stale While Revalidate - return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  // Fetch from network in background
  const networkPromise = fetch(request)
    .then(response => {
      cacheResponse(request, response.clone());
      return response;
    })
    .catch(error => {
      console.warn('Background fetch failed:', error);
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  return networkPromise;
}

/**
 * Cache response with metadata
 */
async function cacheResponse(request, response) {
  // Don't cache non-successful responses
  if (!response.ok) return;

  const cache = await caches.open(RUNTIME_CACHE);

  // Add timestamp metadata
  const responseWithMetadata = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...response.headers,
      'sw-cache-time': Date.now().toString()
    }
  });

  await cache.put(request, responseWithMetadata);
}

/**
 * Get cache time from response headers
 */
function getCacheTime(response) {
  const cacheTime = response.headers.get('sw-cache-time');
  return cacheTime ? parseInt(cacheTime, 10) : 0;
}

/**
 * Determine resource type from request
 */
function getResourceType(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('.html') || pathname === '/') {
    return 'pages';
  } else if (pathname.endsWith('.css')) {
    return 'styles';
  } else if (pathname.endsWith('.js')) {
    return 'scripts';
  } else if (isImage(request)) {
    return 'images';
  } else if (isFont(request)) {
    return 'fonts';
  } else if (pathname.startsWith('/api/')) {
    return 'api';
  }

  return 'pages'; // Default
}

/**
 * Check if request is for an image
 */
function isImage(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(url.pathname) ||
         request.destination === 'image';
}

/**
 * Check if request is for a font
 */
function isFont(request) {
  const url = new URL(request.url);
  return /\.(woff|woff2|ttf|otf|eot)$/i.test(url.pathname) ||
         request.destination === 'font' ||
         url.hostname === 'fonts.googleapis.com' ||
         url.hostname === 'fonts.gstatic.com';
}

/**
 * Handle fetch errors with appropriate fallbacks
 */
async function handleFetchError(request, resourceType) {
  // Try to serve from cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Provide offline fallbacks
  switch (resourceType) {
    case 'pages':
      return createOfflinePage();
    case 'images':
      return createOfflineImage();
    default:
      throw new Error('Network error and no cached response available');
  }
}

/**
 * Create offline page response
 */
function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Armsforge - Offline</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: system-ui, sans-serif;
          background: #1e1e2e;
          color: #cdd6f4;
          text-align: center;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
        }
        .offline-message {
          max-width: 400px;
        }
        h1 { color: #f38ba8; }
        button {
          background: linear-gradient(45deg, #f38ba8, #f5c2e7);
          color: #1e1e2e;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1rem;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <h1>⚔️ Armsforge</h1>
        <h2>You're Offline</h2>
        <p>The page you requested is not available offline. Please check your connection and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Create offline image response (1x1 transparent pixel)
 */
function createOfflineImage() {
  const transparentPixel = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';

  return fetch(transparentPixel);
}

// Background sync for analytics
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

/**
 * Sync analytics data when back online
 */
async function syncAnalytics() {
  // Implement analytics syncing logic
  console.log('Syncing analytics data...');
}

// Push notifications support
self.addEventListener('push', event => {
  if (!event.data) return;

  const options = {
    body: event.data.text(),
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Armsforge', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});