/**
 * Experiments PWA - Service Worker
 * Cache-first strategy for static assets, network-first for dynamic data
 * Version-based cache invalidation
 */

const CACHE_VERSION = 'v1.0.6';
const CACHE_NAME = `experiments-${CACHE_VERSION}`;

// Assets to cache on install (relative paths for GitHub Pages subdirectory support)
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/tokens.css',
    './css/base.css',
    './css/components.css',
    './js/data.js',
    './js/ui.js',
    './js/app.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// Offline fallback page
const OFFLINE_PAGE = './index.html';

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache install failed:', error);
            })
    );
});

/**
 * Message event - handle commands from app
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('experiments-') && name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - cache-first for static assets, network-first for others
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Cache-first strategy for static assets
    if (isStaticAsset(request)) {
        event.respondWith(cacheFirst(request));
    } else {
        // Network-first for everything else
        event.respondWith(networkFirst(request));
    }
});

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    return (
        path.endsWith('.html') ||
        path.endsWith('.css') ||
        path.endsWith('.js') ||
        path.endsWith('.png') ||
        path.endsWith('.json') ||
        path === '/'
    );
}

/**
 * Cache-first strategy
 * Try cache, fallback to network, update cache
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Return cached response and update cache in background
        updateCache(request);
        return cachedResponse;
    }

    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, return offline page
        return caches.match(OFFLINE_PAGE);
    }
}

/**
 * Network-first strategy
 * Try network, fallback to cache
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page as last resort
        return caches.match(OFFLINE_PAGE);
    }
}

/**
 * Update cache in background (stale-while-revalidate pattern)
 */
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silent fail - we have cached version
    }
}
