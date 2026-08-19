/**
 * Life Compass - Service Worker
 * ============================================
 * Handles offline caching and PWA functionality.
 * 
 * Cache Strategy:
 * - Cache First for static assets (CSS, JS, images)
 * - Network First for dynamic content
 */

const CACHE_NAME = 'life-compass-v1.0.0';
const STATIC_CACHE = 'life-compass-static-v1.0.0';

// Static assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',

    // CSS
    './css/tokens.css',
    './css/base.css',
    './css/components.css',
    './css/animations.css',
    './css/navigation.css',
    './css/modal.css',
    './css/modules/tasks.css',
    './css/modules/habits.css',
    './css/modules/experiments.css',
    './css/modules/mood.css',
    './css/modules/life.css',

    // Core JS
    './js/utils.js',
    './js/db.js',
    './js/app.js',

    // UI Components
    './js/ui/components.js',
    './js/ui/modal.js',
    './js/ui/toast.js',
    './js/ui/navigation.js',

    // Data Repositories
    './js/data/settings.js',
    './js/data/projects.js',
    './js/data/tasks.js',
    './js/data/habits.js',
    './js/data/experiments.js',
    './js/data/mood.js',
    './js/data/life.js',

    // Module Views
    './js/modules/tasks/view.js',
    './js/modules/tasks/form.js',
    './js/modules/habits/today.js',
    './js/modules/habits/form.js',
    './js/modules/experiments/lab.js',
    './js/modules/experiments/wizard.js',
    './js/modules/mood/entry.js',
    './js/modules/mood/history.js',
    './js/modules/life/grid.js',
    './js/modules/life/events.js',

    // Icons
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name.startsWith('life-compass-') &&
                                name !== CACHE_NAME &&
                                name !== STATIC_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (except fonts)
    if (url.origin !== location.origin && !url.hostname.includes('fonts.')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Clone the response before caching
                        const responseToCache = networkResponse.clone();

                        caches.open(STATIC_CACHE)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline fallback for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }

                        throw error;
                    });
            })
    );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});
