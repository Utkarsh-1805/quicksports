'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PushNotificationContext = createContext(null);

/**
 * Push Notification Provider
 * Handles browser push notifications for booking updates
 */
export function PushNotificationProvider({ children }) {
    const [permission, setPermission] = useState('default');
    const [subscription, setSubscription] = useState(null);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        // Check if push notifications are supported
        if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
            setSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!supported) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            
            if (result === 'granted') {
                await subscribeToNotifications();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    }, [supported]);

    // Subscribe to push notifications
    const subscribeToNotifications = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Check if already subscribed
            let existingSubscription = await registration.pushManager.getSubscription();
            
            if (!existingSubscription) {
                // Create new subscription
                existingSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BNbxGYNMhEIi9zrneh7mqBs6C9-cpjSlVzXA1KlPYZL0Nq5C4G5xe1_Pyz6vYKw1Q8i9rBbsWU5Cw0LOXpB8LVk'
                    )
                });

                // Send subscription to server
                await saveSubscription(existingSubscription);
            }

            setSubscription(existingSubscription);
            return existingSubscription;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return null;
        }
    };

    // Save subscription to server
    const saveSubscription = async (sub) => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) return;

            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription: sub.toJSON() })
            });
        } catch (error) {
            console.error('Error saving subscription:', error);
        }
    };

    // Unsubscribe from push notifications
    const unsubscribe = async () => {
        try {
            if (subscription) {
                await subscription.unsubscribe();
                setSubscription(null);

                // Notify server
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('quickcourt_token='))
                    ?.split('=')[1];

                if (token) {
                    await fetch('/api/notifications/unsubscribe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }
    };

    // Show a local notification (for testing/demo)
    const showNotification = (title, options = {}) => {
        if (permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }

        const defaultOptions = {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            tag: 'quickcourt-notification',
            ...options
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, defaultOptions);
            });
        } else {
            new Notification(title, defaultOptions);
        }
    };

    return (
        <PushNotificationContext.Provider value={{
            supported,
            permission,
            subscription,
            requestPermission,
            unsubscribe,
            showNotification
        }}>
            {children}
        </PushNotificationContext.Provider>
    );
}

export function usePushNotifications() {
    const context = useContext(PushNotificationContext);
    if (!context) {
        throw new Error('usePushNotifications must be used within PushNotificationProvider');
    }
    return context;
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default PushNotificationProvider;
