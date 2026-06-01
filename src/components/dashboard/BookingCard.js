'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useState } from 'react';

/**
 * BookingCard Component
 * Displays booking information with actions
 */
export function BookingCard({
    booking,
    variant = 'default', // 'default' | 'compact' | 'detailed'
    onCancel,
    onDownload,
    onReview,
    showActions = true
}) {
    const [showMenu, setShowMenu] = useState(false);

    const getSportIcon = (sportType) => {
        const icons = {
            'TENNIS': '🎾',
            'BADMINTON': '🏸',
            'BASKETBALL': '🏀',
            'FOOTBALL': '⚽',
            'TABLE_TENNIS': '🏓',
            'SWIMMING': '🏊',
            'CRICKET': '🏏',
            'VOLLEYBALL': '🏐'
        };
        return icons[sportType] || '🏆';
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const getStatusPillClass = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return 'pill';
            case 'PENDING':
                return 'pill secondary';
            case 'CANCELLED':
                return 'pill error';
            case 'COMPLETED':
                return 'pill tertiary';
            default:
                return 'pill neutral';
        }
    };

    const isUpcoming = () => {
        const bookingDate = new Date(booking.date || booking.bookingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookingDate >= today && booking.status === 'CONFIRMED';
    };

    const canCancel = () => {
        return isUpcoming() && booking.status !== 'CANCELLED';
    };

    const canReview = () => {
        return booking.status === 'COMPLETED' && !booking.hasReview;
    };

    // Compact variant for dashboard
    if (variant === 'compact') {
        return (
            <Link
                href={booking.status === 'CONFIRMED' ? `/booking/confirmation/${booking.id}` : `/bookings`}
                className="card card-hover flex items-center gap-4 p-4"
            >
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-2xl shrink-0">
                    {getSportIcon(booking.court?.sportType)}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-display font-semibold text-on-surface truncate">{booking.court?.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-0.5">
                        <Icon name="event" size={14} />
                        <span className="font-mono">{formatDate(booking.date || booking.bookingDate)}</span>
                        <span>·</span>
                        <span className="font-mono">{formatTime(booking.startTime)}</span>
                    </div>
                </div>
                <span className={getStatusPillClass(booking.status)}>
                    {booking.status}
                </span>
                <Icon name="chevron_right" size={20} className="text-on-surface-variant" />
            </Link>
        );
    }

    // Default/detailed variant
    return (
        <div className="card card-hover overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[10px] bg-primary-container text-on-primary-container flex items-center justify-center text-xl shrink-0">
                            {getSportIcon(booking.court?.sportType)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-display font-semibold text-lg text-on-surface truncate">{booking.court?.name}</h3>
                            <p className="text-sm text-on-surface-variant truncate">{booking.venue?.name || booking.court?.facility?.name}</p>
                        </div>
                    </div>
                    <span className={getStatusPillClass(booking.status)}>
                        {booking.status}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-surface-container flex items-center justify-center shrink-0">
                            <Icon name="event" size={20} className="text-on-surface-variant" />
                        </div>
                        <div>
                            <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.1em] font-mono">Date</p>
                            <p className="font-mono font-semibold text-on-surface">{formatDate(booking.date || booking.bookingDate)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-surface-container flex items-center justify-center shrink-0">
                            <Icon name="schedule" size={20} className="text-on-surface-variant" />
                        </div>
                        <div>
                            <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.1em] font-mono">Time</p>
                            <p className="font-mono font-semibold text-on-surface">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                        </div>
                    </div>
                </div>

                {(booking.venue?.address || booking.court?.facility?.address) && (
                    <div className="flex items-start gap-3 mb-4 p-3 bg-surface-container-low rounded-xl">
                        <Icon name="location_on" size={20} className="text-on-surface-variant mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm text-on-surface">
                                {booking.venue?.address || booking.court?.facility?.address}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                                {booking.venue?.city || booking.court?.facility?.city}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                    <div>
                        <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.1em] font-mono">Total Paid</p>
                        <p className="font-display text-2xl font-semibold text-primary">₹{(booking.paidAmount || booking.payment?.totalAmount || booking.totalAmount || booking.amount)?.toLocaleString()}</p>
                        {booking.paidAmount && booking.paidAmount !== booking.totalAmount && (
                            <p className="text-xs text-on-surface-variant/70">Includes GST & fees</p>
                        )}
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-2">
                            {booking.status === 'CONFIRMED' && (
                                <Link
                                    href={`/booking/confirmation/${booking.id}`}
                                    className="btn btn-cta btn-sm"
                                >
                                    <Icon name="confirmation_number" size={16} />
                                    View Ticket
                                </Link>
                            )}

                            {canCancel() && onCancel && (
                                <button
                                    onClick={() => onCancel(booking)}
                                    className="btn btn-outline btn-sm"
                                >
                                    <Icon name="cancel" size={16} />
                                    Cancel
                                </button>
                            )}

                            {canReview() && onReview && (
                                <button
                                    onClick={() => onReview(booking)}
                                    className="btn btn-cta btn-sm"
                                >
                                    <Icon name="star" filled size={16} />
                                    Review
                                </button>
                            )}

                            {booking.status === 'COMPLETED' && onDownload && (
                                <button
                                    onClick={() => onDownload(booking.id)}
                                    className="btn btn-outline btn-sm"
                                    title="Download Receipt"
                                >
                                    <Icon name="download" size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookingCard;
