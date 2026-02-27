'use client';

import Link from 'next/link';
import { 
    Calendar, 
    Clock, 
    User, 
    ChevronRight,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';

/**
 * RecentBookingsTable Component
 * Displays recent bookings for owner dashboard
 */
export function RecentBookingsTable({ bookings = [], loading = false }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return { 
                    icon: CheckCircle, 
                    color: 'text-green-600', 
                    bg: 'bg-green-50',
                    label: 'Confirmed'
                };
            case 'PENDING':
                return { 
                    icon: Loader2, 
                    color: 'text-yellow-600', 
                    bg: 'bg-yellow-50',
                    label: 'Pending'
                };
            case 'CANCELLED':
                return { 
                    icon: XCircle, 
                    color: 'text-red-600', 
                    bg: 'bg-red-50',
                    label: 'Cancelled'
                };
            case 'COMPLETED':
                return { 
                    icon: CheckCircle, 
                    color: 'text-blue-600', 
                    bg: 'bg-blue-50',
                    label: 'Completed'
                };
            default:
                return { 
                    icon: AlertCircle, 
                    color: 'text-slate-600', 
                    bg: 'bg-slate-50',
                    label: status
                };
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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
        return formatDate(dateStr);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <div className="h-6 w-40 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                                <div className="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Recent Bookings</h3>
                        <p className="text-sm text-slate-500">Latest customer bookings</p>
                    </div>
                </div>
                <Link
                    href="/owner/bookings"
                    className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1"
                >
                    View All
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Table */}
            {bookings.length > 0 ? (
                <div className="divide-y divide-slate-100">
                    {bookings.map((booking) => {
                        const statusConfig = getStatusConfig(booking.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <div
                                key={booking.id}
                                className="p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {/* User Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {booking.userName?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                                    </div>
                                    
                                    {/* Booking Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900 truncate">
                                                {booking.userName || 'Guest'}
                                            </p>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-sm text-slate-500 truncate">
                                                {booking.courtName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(booking.bookingDate || booking.createdAt)}</span>
                                            </div>
                                            {booking.startTime && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{formatTime(booking.startTime)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Amount */}
                                    <div className="text-right shrink-0">
                                        <p className="font-semibold text-slate-900">
                                            ₹{(booking.totalAmount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatTimeAgo(booking.createdAt)}
                                        </p>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color} shrink-0`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusConfig.label}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-1">No Bookings Yet</h3>
                    <p className="text-sm text-slate-500">
                        Bookings will appear here once customers start booking your courts.
                    </p>
                </div>
            )}
        </div>
    );
}

export default RecentBookingsTable;
