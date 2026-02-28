'use client';

import { useState } from 'react';
import { Bell, BellOff, BellRing, Check, X, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/contexts/PushNotificationContext';

/**
 * NotificationBell Component
 * Toggle button for push notification subscription
 */
export function NotificationBell({ className = '' }) {
    const { supported, permission, subscription, requestPermission, unsubscribe } = usePushNotifications();
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    if (!supported) {
        return null;
    }

    const handleToggle = async () => {
        setLoading(true);
        try {
            if (permission === 'granted' && subscription) {
                await unsubscribe();
            } else {
                await requestPermission();
            }
        } catch (error) {
            console.error('Error toggling notifications:', error);
        }
        setLoading(false);
    };

    const isEnabled = permission === 'granted' && subscription;
    const isDenied = permission === 'denied';

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleToggle}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                disabled={loading || isDenied}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isEnabled 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : isDenied
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label={isEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isEnabled ? (
                    <BellRing className="w-5 h-5" />
                ) : isDenied ? (
                    <BellOff className="w-5 h-5" />
                ) : (
                    <Bell className="w-5 h-5" />
                )}
                
                {/* Active indicator */}
                {isEnabled && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
                    {isDenied 
                        ? 'Notifications blocked by browser'
                        : isEnabled 
                        ? 'Click to disable notifications' 
                        : 'Get booking updates'}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
            )}
        </div>
    );
}

/**
 * NotificationBanner Component
 * Promotional banner to enable notifications
 */
export function NotificationBanner({ onClose }) {
    const { supported, permission, requestPermission } = usePushNotifications();
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Don't show if not supported, already granted, or dismissed
    if (!supported || permission === 'granted' || permission === 'denied' || dismissed) {
        return null;
    }

    const handleEnable = async () => {
        setLoading(true);
        const success = await requestPermission();
        setLoading(false);
        if (success) {
            setDismissed(true);
            onClose?.();
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        onClose?.();
    };

    return (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <BellRing className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold mb-1">Never miss a booking update!</h4>
                    <p className="text-green-100 text-sm mb-3">
                        Get instant notifications for confirmations, reminders, and special offers.
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="px-4 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Enable Notifications
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors"
                        >
                            Not Now
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

/**
 * NotificationSettings Component
 * Full settings panel for notifications
 */
export function NotificationSettings() {
    const { supported, permission, subscription, requestPermission, unsubscribe, showNotification } = usePushNotifications();
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            if (permission === 'granted' && subscription) {
                await unsubscribe();
            } else {
                await requestPermission();
            }
        } catch (error) {
            console.error('Error toggling notifications:', error);
        }
        setLoading(false);
    };

    const handleTest = () => {
        showNotification('QuickCourt Test', {
            body: 'Push notifications are working! 🎉',
            icon: '/icons/icon-192x192.png'
        });
    };

    if (!supported) {
        return (
            <div className="p-6 bg-slate-50 rounded-2xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
                        <BellOff className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-1">Notifications Not Supported</h3>
                        <p className="text-sm text-slate-500">
                            Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isEnabled = permission === 'granted' && subscription;
    const isDenied = permission === 'denied';

    return (
        <div className="space-y-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isEnabled ? 'bg-green-100' : 'bg-slate-100'
                        }`}>
                            {isEnabled ? (
                                <BellRing className="w-6 h-6 text-green-600" />
                            ) : (
                                <Bell className="w-6 h-6 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Push Notifications</h3>
                            <p className="text-sm text-slate-500">
                                {isDenied 
                                    ? 'Blocked by your browser settings'
                                    : isEnabled 
                                    ? 'Receiving booking updates' 
                                    : 'Get notified about booking updates'}
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleToggle}
                        disabled={loading || isDenied}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                            isEnabled ? 'bg-green-500' : 'bg-slate-300'
                        } ${isDenied ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                            isEnabled ? 'left-7' : 'left-1'
                        }`}>
                            {loading && <Loader2 className="w-4 h-4 m-1 text-slate-400 animate-spin" />}
                        </span>
                    </button>
                </div>

                {isDenied && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
                        <p className="font-medium mb-1">Notifications are blocked</p>
                        <p>To enable notifications, click the lock icon in your browser's address bar and allow notifications for this site.</p>
                    </div>
                )}
            </div>

            {isEnabled && (
                <button
                    onClick={handleTest}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Bell className="w-4 h-4" />
                    Send Test Notification
                </button>
            )}

            <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-700 mb-2">You'll be notified about:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Booking confirmations
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Booking reminders (1 hour before)
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Cancellations & refunds
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Special offers & discounts
                    </li>
                </ul>
            </div>
        </div>
    );
}
