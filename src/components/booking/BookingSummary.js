'use client';

import { MapPin, Calendar, Clock, CreditCard, Info, Tag, Shield } from 'lucide-react';

/**
 * BookingSummary Component
 * Displays complete booking details with price breakdown
 */
export function BookingSummary({ 
    court, 
    venue, 
    selectedDate, 
    selectedSlots,
    pricePerHour
}) {
    // Calculate booking details
    const duration = selectedSlots.length;
    const subtotal = duration * pricePerHour;
    const convenienceFee = Math.round(subtotal * 0.02); // 2% convenience fee
    const gst = Math.round((subtotal + convenienceFee) * 0.18); // 18% GST on service
    const totalAmount = subtotal + convenienceFee + gst;

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTimeRange = () => {
        if (selectedSlots.length === 0) return '';
        const sortedSlots = [...selectedSlots].sort((a, b) => 
            a.startTime.localeCompare(b.startTime)
        );
        return `${formatTime(sortedSlots[0].startTime)} - ${formatTime(sortedSlots[sortedSlots.length - 1].endTime)}`;
    };

    const getSportIcon = (sportType) => {
        const icons = {
            'TENNIS': '🎾',
            'BADMINTON': '🏸',
            'BASKETBALL': '🏀',
            'FOOTBALL': '⚽',
            'TABLE_TENNIS': '🏓',
            'SWIMMING': '🏊',
            'CRICKET': '🏏',
            'VOLLEYBALL': '🏐',
            'SQUASH': '🎾'
        };
        return icons[sportType] || '🏆';
    };

    const hasBookingDetails = court && selectedDate && selectedSlots.length > 0;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden sticky top-28">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">Booking Summary</h3>
                <p className="text-green-100 text-sm">Review your booking details</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Court Info */}
                {court && (
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl shrink-0">
                            {getSportIcon(court.sportType)}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{court.name}</h4>
                            <p className="text-sm text-slate-500 capitalize">{court.sportType?.toLowerCase().replace('_', ' ')}</p>
                            {venue && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{venue.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Booking Details */}
                {hasBookingDetails ? (
                    <>
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-medium">Date</p>
                                    <p className="text-sm font-semibold text-slate-800">{formatDate(selectedDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-medium">Time Slot</p>
                                    <p className="text-sm font-semibold text-slate-800">{getTimeRange()}</p>
                                    <p className="text-xs text-slate-500">{duration} hour{duration > 1 ? 's' : ''} duration</p>
                                </div>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm">Court Charges ({duration} hr × ₹{pricePerHour})</span>
                                <span className="font-medium text-slate-900">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-600 text-sm">Convenience Fee</span>
                                    <Info className="w-3 h-3 text-slate-400" />
                                </div>
                                <span className="font-medium text-slate-900">₹{convenienceFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm">GST (18%)</span>
                                <span className="font-medium text-slate-900">₹{gst.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="pt-4 border-t-2 border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-900">Total Amount</span>
                                <span className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                            <Shield className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-xs font-semibold text-green-700">Secure Booking</p>
                                <p className="text-[10px] text-green-600">Your payment is protected</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm">
                            Select a date and time slot to see your booking summary
                        </p>
                    </div>
                )}

                {/* Promo Code */}
                {hasBookingDetails && (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Tag className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Have a promo code?"
                            className="w-full pl-10 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-green-600 hover:text-green-700">
                            Apply
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingSummary;
