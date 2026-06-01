'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/**
 * RecentBookingsTable Component
 * Displays recent bookings for owner dashboard
 */
export function RecentBookingsTable({ bookings = [], loading = false }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return {
                    iconName: 'check_circle',
                    pill: 'pill',
                    label: 'Confirmed'
                };
            case 'PENDING':
                return {
                    iconName: 'schedule',
                    pill: 'pill secondary',
                    label: 'Pending'
                };
            case 'CANCELLED':
                return {
                    iconName: 'cancel',
                    pill: 'pill error',
                    label: 'Cancelled'
                };
            case 'COMPLETED':
                return {
                    iconName: 'task_alt',
                    pill: 'pill tertiary',
                    label: 'Completed'
                };
            default:
                return {
                    iconName: 'info',
                    pill: 'pill neutral',
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
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-outline-variant/40">
                    <div className="h-6 w-40 bg-surface-container-high rounded animate-pulse"></div>
                </div>
                <div className="divide-y divide-outline-variant/40">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-surface-container-high rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse"></div>
                                <div className="h-3 w-48 bg-surface-container rounded animate-pulse"></div>
                            </div>
                            <div className="h-6 w-20 bg-surface-container-high rounded-full animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-on-surface">Recent bookings</h3>
                <Link
                    href="/owner/bookings"
                    className="text-sm text-primary font-semibold hover:opacity-80 flex items-center gap-1"
                >
                    View all
                    <Icon name="arrow_forward" size={14} />
                </Link>
            </div>

            {/* Table headers (visible on md+) */}
            {bookings.length > 0 && (
                <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold border-b border-outline-variant/40 font-mono">
                    <span className="w-10"></span>
                    <span>Customer / Court</span>
                    <span className="text-right">Amount</span>
                    <span>Status</span>
                </div>
            )}

            {/* Body */}
            {bookings.length > 0 ? (
                <div className="divide-y divide-outline-variant/40">
                    {bookings.map((booking) => {
                        const statusConfig = getStatusConfig(booking.status);

                        return (
                            <div
                                key={booking.id}
                                className="p-4 hover:bg-surface-container-low/50 transition-colors text-on-surface text-sm"
                            >
                                <div className="flex items-center gap-4">
                                    {/* User Avatar */}
                                    <div className="avatar w-9 h-9 shrink-0 bg-primary-container text-on-primary-container">
                                        {booking.userName?.charAt(0).toUpperCase() || (
                                            <Icon name="person" size={18} />
                                        )}
                                    </div>

                                    {/* Booking Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-on-surface truncate">
                                                {booking.userName || 'Guest'}
                                            </p>
                                            <span className="text-on-surface-variant/40">•</span>
                                            <span className="text-sm text-on-surface-variant truncate">
                                                {booking.courtName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant font-mono">
                                            <div className="flex items-center gap-1">
                                                <Icon name="calendar_today" size={14} />
                                                <span>{formatDate(booking.bookingDate || booking.createdAt)}</span>
                                            </div>
                                            {booking.startTime && (
                                                <div className="flex items-center gap-1">
                                                    <Icon name="schedule" size={14} />
                                                    <span>{formatTime(booking.startTime)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-semibold text-on-surface">
                                            ₹{(booking.totalAmount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-on-surface-variant/70 font-mono">
                                            {formatTimeAgo(booking.createdAt)}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <span className={`${statusConfig.pill} shrink-0`}>
                                        <Icon name={statusConfig.iconName} size={12} />
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="calendar_today" size={32} className="text-on-surface-variant/60" />
                    </div>
                    <h3 className="font-display font-semibold text-on-surface mb-1">No Bookings Yet</h3>
                    <p className="text-sm text-on-surface-variant">
                        Bookings will appear here once customers start booking your courts.
                    </p>
                </div>
            )}
        </div>
    );
}

export default RecentBookingsTable;
