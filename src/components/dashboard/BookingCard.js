'use client';

import Link from 'next/link';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    ChevronRight,
    Ticket,
    XCircle,
    Download,
    Star,
    MoreVertical
} from 'lucide-react';
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

    const getStatusStyles = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
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
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-md transition-all"
            >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-2xl shrink-0">
                    {getSportIcon(booking.court?.sportType)}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">{booking.court?.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(booking.date || booking.bookingDate)}</span>
                        <span>•</span>
                        <span>{formatTime(booking.startTime)}</span>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(booking.status)}`}>
                    {booking.status}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
        );
    }

    // Default/detailed variant
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-200 hover:shadow-lg transition-all">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl backdrop-blur-sm">
                            {getSportIcon(booking.court?.sportType)}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{booking.court?.name}</h3>
                            <p className="text-sm text-white/80">{booking.venue?.name || booking.court?.facility?.name}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(booking.status)}`}>
                        {booking.status}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                            <p className="font-semibold text-slate-900">{formatDate(booking.date || booking.bookingDate)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Time</p>
                            <p className="font-semibold text-slate-900">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                        </div>
                    </div>
                </div>

                {(booking.venue?.address || booking.court?.facility?.address) && (
                    <div className="flex items-start gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm text-slate-600">
                                {booking.venue?.address || booking.court?.facility?.address}
                            </p>
                            <p className="text-sm text-slate-500">
                                {booking.venue?.city || booking.court?.facility?.city}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                        <p className="text-xs text-slate-500">Total Paid</p>
                        <p className="text-xl font-bold text-green-600">₹{(booking.paidAmount || booking.payment?.totalAmount || booking.totalAmount || booking.amount)?.toLocaleString()}</p>
                        {booking.paidAmount && booking.paidAmount !== booking.totalAmount && (
                            <p className="text-xs text-slate-400">Includes GST & fees</p>
                        )}
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-2">
                            {booking.status === 'CONFIRMED' && (
                                <Link
                                    href={`/booking/confirmation/${booking.id}`}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Ticket className="w-4 h-4" />
                                    View Ticket
                                </Link>
                            )}

                            {canCancel() && onCancel && (
                                <button
                                    onClick={() => onCancel(booking)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Cancel
                                </button>
                            )}

                            {canReview() && onReview && (
                                <button
                                    onClick={() => onReview(booking)}
                                    className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Review
                                </button>
                            )}

                            {booking.status === 'COMPLETED' && onDownload && (
                                <button
                                    onClick={() => onDownload(booking.id)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                    title="Download Receipt"
                                >
                                    <Download className="w-4 h-4" />
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
