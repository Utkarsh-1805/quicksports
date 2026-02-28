// QuickCourt Service Worker for Push Notifications
// Version 1.0.0

const CACHE_NAME = 'quickcourt-cache-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');
    
    let data = {
        title: 'QuickCourt',
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'quickcourt-notification',
        data: {}
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'quickcourt-notification',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    
    event.notification.close();

    const notificationData = event.notification.data || {};
    let targetUrl = '/dashboard';

    // Handle different notification types
    if (notificationData.type === 'booking_confirmed') {
        targetUrl = `/dashboard/bookings/${notificationData.bookingId}`;
    } else if (notificationData.type === 'booking_reminder') {
        targetUrl = `/dashboard/bookings/${notificationData.bookingId}`;
    } else if (notificationData.type === 'booking_cancelled') {
        targetUrl = '/dashboard/bookings';
    } else if (notificationData.url) {
        targetUrl = notificationData.url;
    }

    if (event.action === 'dismiss') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window/tab open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }
                // Open a new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed');
});

// Handle background sync for offline functionality
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Sync event:', event.tag);
    
    if (event.tag === 'sync-bookings') {
        event.waitUntil(syncBookings());
    }
});

async function syncBookings() {
    // Implement offline booking sync if needed
    console.log('[Service Worker] Syncing bookings...');
}

// Fetch event for caching (optional)
self.addEventListener('fetch', (event) => {
    // Basic network-first strategy for API calls
    if (event.request.url.includes('/api/')) {
        return;
    }
});
