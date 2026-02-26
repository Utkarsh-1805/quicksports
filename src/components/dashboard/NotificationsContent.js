'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Bell,
    Calendar,
    CreditCard,
    CheckCircle,
    XCircle,
    Star,
    MessageSquare,
    Gift,
    AlertCircle,
    ChevronRight,
    Loader2,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    RefreshCw,
    BellOff,
    Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * NotificationsPage Component
 * Displays user notifications with read/unread states and actions
 */
export default function NotificationsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const [deletingRead, setDeletingRead] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    
    // Pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/dashboard/notifications');
            return;
        }

        fetchNotifications(true);
    }, [user, authLoading, filter]);

    const fetchNotifications = async (reset = false) => {
        if (reset) {
            setLoading(true);
            setPage(1);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view notifications');
            }

            const currentPage = reset ? 1 : page;
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                includeStats: 'true'
            });

            if (filter === 'unread') {
                params.append('unreadOnly', 'true');
            }

            const res = await fetch(`/api/notifications?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                const newNotifications = data.data.notifications || [];
                if (reset) {
                    setNotifications(newNotifications);
                } else {
                    setNotifications(prev => [...prev, ...newNotifications]);
                }
                setUnreadCount(data.data.unreadCount || 0);
                setHasMore(newNotifications.length === 20);
                setPage(currentPage + 1);
            } else {
                throw new Error(data.message || 'Failed to load notifications');
            }
        } catch (err) {
            console.error('Fetch notifications error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    };

    const markAllAsRead = async () => {
        setMarkingAllRead(true);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/notifications', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Mark all as read error:', err);
            setError(err.message);
        } finally {
            setMarkingAllRead(false);
        }
    };

    const deleteReadNotifications = async () => {
        setDeletingRead(true);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setNotifications(prev => prev.filter(n => !n.isRead));
            }
        } catch (err) {
            console.error('Delete read notifications error:', err);
            setError(err.message);
        } finally {
            setDeletingRead(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING_CREATED':
            case 'BOOKING_REMINDER':
                return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
            case 'BOOKING_CONFIRMED':
                return { icon: CheckCircle, color: 'bg-green-100 text-green-600' };
            case 'BOOKING_CANCELLED':
                return { icon: XCircle, color: 'bg-red-100 text-red-600' };
            case 'PAYMENT_SUCCESS':
                return { icon: CreditCard, color: 'bg-green-100 text-green-600' };
            case 'PAYMENT_FAILED':
                return { icon: CreditCard, color: 'bg-red-100 text-red-600' };
            case 'REVIEW_REQUESTED':
            case 'REVIEW_POSTED':
                return { icon: Star, color: 'bg-yellow-100 text-yellow-600' };
            case 'PROMOTIONAL':
            case 'OFFER':
                return { icon: Gift, color: 'bg-purple-100 text-purple-600' };
            case 'SYSTEM':
            case 'ANNOUNCEMENT':
                return { icon: Bell, color: 'bg-slate-100 text-slate-600' };
            default:
                return { icon: Bell, color: 'bg-slate-100 text-slate-600' };
        }
    };

    const formatTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                            <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-slate-900">Notifications</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-slate-900">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="px-2.5 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                    </div>
                    <Link href="/dashboard/profile">
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors">
                            <Settings className="w-4 h-4" />
                            Preferences
                        </button>
                    </Link>
                </div>

                {/* Filters & Actions Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Filter Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filter === 'all'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    filter === 'unread'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Unread {unreadCount > 0 && `(${unreadCount})`}
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={markingAllRead}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {markingAllRead ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCheck className="w-4 h-4" />
                                    )}
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={deleteReadNotifications}
                                disabled={deletingRead || notifications.filter(n => n.isRead).length === 0}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingRead ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Clear read
                            </button>
                            <button
                                onClick={() => fetchNotifications(true)}
                                disabled={loading}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-3 w-1/4 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <>
                        <div className="space-y-2">
                            {notifications.map((notification) => {
                                const { icon: Icon, color } = getNotificationIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                                        className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                                            notification.isRead
                                                ? 'border-slate-200 hover:border-slate-300'
                                                : 'border-green-200 bg-green-50/50 hover:bg-green-50'
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center shrink-0`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className={`font-medium ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className={`text-sm mt-0.5 ${notification.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 mt-1.5"></div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {notification.actionUrl && (
                                            <div className="mt-3 ml-16">
                                                <Link
                                                    href={notification.actionUrl}
                                                    className="inline-flex items-center gap-1 text-sm text-green-600 font-medium hover:text-green-700"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {notification.actionLabel || 'View Details'}
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => fetchNotifications(false)}
                                    disabled={loadingMore}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </span>
                                    ) : (
                                        'Load More'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BellOff className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {filter === 'unread' ? 'All Caught Up!' : 'No Notifications'}
                        </h3>
                        <p className="text-slate-500 mb-6">
                            {filter === 'unread'
                                ? "You've read all your notifications"
                                : "You don't have any notifications yet"
                            }
                        </p>
                        {filter === 'unread' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="text-green-600 font-medium hover:text-green-700"
                            >
                                View all notifications
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
