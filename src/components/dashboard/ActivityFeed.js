'use client';

import { 
    Calendar, 
    CreditCard, 
    CheckCircle, 
    XCircle, 
    Star, 
    Bell,
    User
} from 'lucide-react';

/**
 * ActivityFeed Component
 * Displays recent user activities
 */
export function ActivityFeed({ activities = [], loading = false }) {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'BOOKING_CREATED':
                return { icon: Calendar, color: 'bg-blue-100 text-blue-600' };
            case 'BOOKING_CONFIRMED':
                return { icon: CheckCircle, color: 'bg-green-100 text-green-600' };
            case 'BOOKING_CANCELLED':
                return { icon: XCircle, color: 'bg-red-100 text-red-600' };
            case 'PAYMENT_SUCCESS':
                return { icon: CreditCard, color: 'bg-green-100 text-green-600' };
            case 'PAYMENT_FAILED':
                return { icon: CreditCard, color: 'bg-red-100 text-red-600' };
            case 'REVIEW_POSTED':
                return { icon: Star, color: 'bg-yellow-100 text-yellow-600' };
            case 'PROFILE_UPDATED':
                return { icon: User, color: 'bg-purple-100 text-purple-600' };
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
                        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                        <div className="flex-1">
                            <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 w-1/4 bg-slate-100 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!activities.length) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {activities.map((activity, index) => {
                const { icon: Icon, color } = getActivityIcon(activity.type);
                return (
                    <div 
                        key={activity.id || index} 
                        className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700">{activity.message}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatTimeAgo(activity.createdAt)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ActivityFeed;
