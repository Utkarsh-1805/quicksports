'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';

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
                return { icon: 'sports_tennis', bg: 'bg-tertiary-fixed', fg: 'text-on-tertiary-fixed' };
            case 'BOOKING_CONFIRMED':
                return { icon: 'event_available', bg: 'bg-primary-container/20', fg: 'text-primary' };
            case 'BOOKING_CANCELLED':
                return { icon: 'event_busy', bg: 'bg-error-container', fg: 'text-on-error-container' };
            case 'PAYMENT_SUCCESS':
                return { icon: 'credit_card', bg: 'bg-primary-container/20', fg: 'text-primary' };
            case 'PAYMENT_FAILED':
                return { icon: 'credit_card_off', bg: 'bg-error-container', fg: 'text-on-error-container' };
            case 'REVIEW_REQUESTED':
            case 'REVIEW_POSTED':
                return { icon: 'star', bg: 'bg-secondary-fixed', fg: 'text-on-secondary-fixed' };
            case 'PROMOTIONAL':
            case 'OFFER':
                return { icon: 'local_offer', bg: 'bg-secondary-fixed', fg: 'text-on-secondary-fixed' };
            case 'SYSTEM':
            case 'ANNOUNCEMENT':
                return { icon: 'account_circle', bg: 'bg-surface-variant', fg: 'text-on-surface-variant' };
            default:
                return { icon: 'notifications', bg: 'bg-surface-variant', fg: 'text-on-surface-variant' };
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
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Group notifications by day buckets
    const groupNotifications = (items) => {
        const today = [];
        const yesterday = [];
        const earlier = [];
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);

        items.forEach(n => {
            const d = new Date(n.createdAt);
            if (d >= todayStart) today.push(n);
            else if (d >= yesterdayStart) yesterday.push(n);
            else earlier.push(n);
        });
        return { today, yesterday, earlier };
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface pt-28 pb-12 flex items-center justify-center">
                <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
            </div>
        );
    }

    const groups = groupNotifications(notifications);

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                            <Icon name="chevron_right" size={16} />
                            <span className="text-on-surface">Notifications</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-4xl md:text-5xl font-semibold text-on-surface tracking-tight">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="px-3 py-1 bg-primary text-on-primary text-sm font-bold rounded-full font-mono">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                    </div>
                    <Link href="/dashboard/profile" className="btn btn-outline btn-sm">
                        <Icon name="settings" size={16} />
                        Preferences
                    </Link>
                </div>

                {/* Filters & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    {/* Filter Tabs - segmented */}
                    <div className="flex gap-1.5 bg-surface-container p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3.5 py-2 rounded-lg text-sm transition-all ${
                                filter === 'all'
                                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-[var(--shadow-card)]'
                                    : 'text-on-surface-variant font-medium hover:text-on-surface'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3.5 py-2 rounded-lg text-sm transition-all ${
                                filter === 'unread'
                                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-[var(--shadow-card)]'
                                    : 'text-on-surface-variant font-medium hover:text-on-surface'
                            }`}
                        >
                            Unread {unreadCount > 0 && <span className="font-mono text-xs text-on-surface-variant">{unreadCount}</span>}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={markingAllRead}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary hover:bg-primary-container/10 rounded-lg transition-colors disabled:opacity-50 font-medium"
                            >
                                {markingAllRead ? (
                                    <Icon name="progress_activity" size={18} className="animate-spin" />
                                ) : (
                                    <Icon name="done_all" size={18} />
                                )}
                                Mark all read
                            </button>
                        )}
                        <button
                            onClick={deleteReadNotifications}
                            disabled={deletingRead || notifications.filter(n => n.isRead).length === 0}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-error hover:bg-error-container rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {deletingRead ? (
                                <Icon name="progress_activity" size={16} className="animate-spin" />
                            ) : (
                                <Icon name="delete" size={16} />
                            )}
                            Clear read
                        </button>
                        <button
                            onClick={() => fetchNotifications(true)}
                            disabled={loading}
                            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                        >
                            <Icon name="refresh" size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-error-container border border-error/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <Icon name="error" size={20} className="text-error shrink-0" />
                        <p className="text-on-error-container">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-surface-container rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-3/4 bg-surface-container rounded mb-2"></div>
                                        <div className="h-3 w-1/4 bg-surface-container-low rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <>
                        <div className="space-y-8">
                            {/* Today */}
                            {groups.today.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-widest pl-2">Today</h3>
                                    <div className="space-y-2">
                                        {groups.today.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={markAsRead}
                                                getNotificationIcon={getNotificationIcon}
                                                formatTimeAgo={formatTimeAgo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Yesterday */}
                            {groups.yesterday.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-widest pl-2">Yesterday</h3>
                                    <div className="space-y-2">
                                        {groups.yesterday.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={markAsRead}
                                                getNotificationIcon={getNotificationIcon}
                                                formatTimeAgo={formatTimeAgo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Earlier */}
                            {groups.earlier.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-on-surface-variant mb-4 uppercase tracking-widest pl-2">Earlier</h3>
                                    <div className="space-y-2">
                                        {groups.earlier.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={markAsRead}
                                                getNotificationIcon={getNotificationIcon}
                                                formatTimeAgo={formatTimeAgo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => fetchNotifications(false)}
                                    disabled={loadingMore}
                                    className="px-6 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <Icon name="progress_activity" size={16} className="animate-spin" />
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
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="notifications_off" size={40} className="text-on-surface-variant" />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications'}
                        </h3>
                        <p className="text-on-surface-variant mb-6">
                            {filter === 'unread'
                                ? "You've read all your notifications"
                                : "You don't have any notifications yet"
                            }
                        </p>
                        {filter === 'unread' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="text-primary font-medium hover:underline"
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

function NotificationItem({ notification, onMarkAsRead, getNotificationIcon, formatTimeAgo }) {
    const { icon, bg, fg } = getNotificationIcon(notification.type);
    const isUnread = !notification.isRead;

    return (
        <div
            onClick={() => isUnread && onMarkAsRead(notification.id)}
            className={`card relative overflow-hidden p-4 flex items-start gap-4 transition-all duration-300 cursor-pointer group ${
                isUnread
                    ? 'card-hover'
                    : 'bg-surface hover:bg-surface-container-lowest'
            }`}
        >
            {/* Unread accent bar */}
            {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container"></div>}

            <div className={`flex-shrink-0 w-12 h-12 ${bg} ${fg} rounded-full flex items-center justify-center mt-1`}>
                <Icon name={icon} />
            </div>

            <div className={`flex-1 min-w-0 ${isUnread ? '' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-display font-semibold text-base text-on-surface truncate">
                        {notification.title}
                    </h4>
                    <span className="text-sm text-on-surface-variant flex-shrink-0 font-mono">
                        {formatTimeAgo(notification.createdAt)}
                    </span>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-2">
                    {notification.message}
                </p>

                {notification.actionUrl && (
                    <div className="mt-3">
                        <Link
                            href={notification.actionUrl}
                            className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {notification.actionLabel || 'View Details'}
                            <Icon name="chevron_right" size={16} />
                        </Link>
                    </div>
                )}
            </div>

            {isUnread && (
                <div aria-label="Unread" className="flex-shrink-0 w-3 h-3 bg-secondary-container rounded-full mt-2"></div>
            )}
        </div>
    );
}
