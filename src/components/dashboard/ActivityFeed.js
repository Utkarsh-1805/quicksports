'use client';

import { Icon } from '@/components/ui/Icon';

/**
 * ActivityFeed Component
 * Displays recent user activities
 */
export function ActivityFeed({ activities = [], loading = false }) {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'BOOKING_CREATED':
                return { name: 'calendar_today', tone: 'bg-primary text-on-primary' };
            case 'BOOKING_CONFIRMED':
                return { name: 'check_circle', tone: 'bg-primary text-on-primary' };
            case 'BOOKING_CANCELLED':
                return { name: 'cancel', tone: 'bg-error text-on-error' };
            case 'PAYMENT_SUCCESS':
                return { name: 'credit_card', tone: 'bg-primary text-on-primary' };
            case 'PAYMENT_FAILED':
                return { name: 'credit_card', tone: 'bg-error text-on-error' };
            case 'REVIEW_POSTED':
                return { name: 'star', tone: 'bg-secondary-container text-on-secondary-container', filled: true };
            case 'PROFILE_UPDATED':
                return { name: 'person', tone: 'bg-tertiary text-on-tertiary' };
            default:
                return { name: 'notifications', tone: 'bg-surface-container-high text-on-surface-variant' };
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

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high"></div>
                        <div className="flex-1">
                            <div className="h-4 w-3/4 bg-surface-container-high rounded mb-2"></div>
                            <div className="h-3 w-1/4 bg-surface-container rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!activities.length) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                    <Icon name="notifications" size={32} className="text-on-surface-variant" />
                </div>
                <p className="text-on-surface-variant">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-[18px]">
            {/* Spine */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline-variant" />
            {activities.map((activity, index) => {
                const { name, tone, filled } = getActivityIcon(activity.type);
                return (
                    <div
                        key={activity.id || index}
                        className="relative z-10 flex gap-3 items-start"
                    >
                        {/* Dot/icon */}
                        <div className={`relative w-6 h-6 rounded-full ${tone} flex items-center justify-center shrink-0 border-[3px] border-surface-container-lowest box-content -ml-px`}>
                            <Icon name={name} filled={!!filled} size={14} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface">{activity.message}</p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-on-surface-variant mt-1">{formatTimeAgo(activity.createdAt)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ActivityFeed;
