// Lockey PWA Service Worker — Offline Mode
const CACHE_VERSION = 'lockey-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_QUEUE_KEY = 'lockey-offline-queue';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  './',
  './gallery',
  './camera',
  './stats',
  './subscriptions',
  './settings',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// API routes that should be cached (GET only)
const CACHEABLE_API = [
  '/api/entries',
  '/api/settings',
  '/api/stats',
  '/api/subscriptions',
  '/api/budgets',
  '/api/streak',
  '/api/badges',
  '/api/goals',
];

// ============================================================
// INSTALL — Pre-cache app shell
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Precache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE — Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ============================================================
// FETCH — Strategy routing
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET for caching (mutations handled by offline queue)
  if (request.method !== 'GET') {
    // For POST/PUT/DELETE: try network, if offline queue it
    if (isMutationRequest(request)) {
      event.respondWith(handleMutation(request));
    }
    return;
  }

  // Strategy: _next/static → Cache First (immutable)
  if (url.pathname.includes('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy: _next/image, fonts → Cache First
  if (
    url.pathname.includes('/_next/image') ||
    url.pathname.includes('/fonts/') ||
    request.url.includes('fonts.googleapis.com') ||
    request.url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy: API photo serving → Cache First (immutable photos)
  if (url.pathname.includes('/api/photos/')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy: Cacheable API → Network First, fallback to cache
  if (CACHEABLE_API.some((api) => url.pathname.endsWith(api) || url.pathname.includes(api))) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy: Page navigation → Network First, fallback to cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy: Everything else → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ============================================================
// Cache Strategies
// ============================================================

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For HTML pages, return cached gallery as fallback
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./');
      if (fallback) return fallback;
    }

    return new Response(
      JSON.stringify({ error: 'offline', message: 'You are offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ============================================================
// Offline Mutation Queue
// ============================================================

function isMutationRequest(request) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
}

async function handleMutation(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch {
    // Offline — queue the mutation
    await queueMutation(request);
    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Saved offline. Will sync when back online.',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function queueMutation(request) {
  try {
    const body = await request.text();
    const item = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };

    // Store in IndexedDB via message to clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'QUEUE_MUTATION', item });
    });
  } catch (err) {
    console.error('[SW] Failed to queue mutation:', err);
  }
}

// ============================================================
// Message handler — sync trigger from client
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'SYNC_NOW') {
    // Client triggers sync
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'TRIGGER_SYNC' });
  });
}
