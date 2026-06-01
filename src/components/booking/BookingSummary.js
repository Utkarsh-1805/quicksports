'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CouponInput } from '@/components/ui/CouponInput';

/**
 * BookingSummary Component
 * Displays complete booking details with price breakdown
 */
export function BookingSummary({
    court,
    venue,
    selectedDate,
    selectedSlots,
    pricePerHour,
    onCouponApplied,
    onCouponRemoved,
}) {
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const duration = selectedSlots.length;
    const subtotal = duration * pricePerHour;
    const convenienceFee = Math.round(subtotal * 0.02);
    const amountAfterDiscount = subtotal - appliedDiscount;
    const gst = Math.round((amountAfterDiscount + convenienceFee) * 0.18);
    const totalAmount = amountAfterDiscount + convenienceFee + gst;

    const handleCouponApplied = (coupon, discount) => {
        setAppliedCoupon(coupon);
        setAppliedDiscount(discount);
        onCouponApplied?.(coupon, discount);
    };

    const handleCouponRemoved = () => {
        setAppliedCoupon(null);
        setAppliedDiscount(0);
        onCouponRemoved?.();
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
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getTimeRange = () => {
        if (selectedSlots.length === 0) return '';
        const sortedSlots = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return `${formatTime(sortedSlots[0].startTime)} - ${formatTime(sortedSlots[sortedSlots.length - 1].endTime)}`;
    };

    const getSportIcon = (sportType) => {
        const icons = {
            TENNIS: 'sports_tennis',
            BADMINTON: 'sports_tennis',
            BASKETBALL: 'sports_basketball',
            FOOTBALL: 'sports_soccer',
            TABLE_TENNIS: 'sports_tennis',
            SWIMMING: 'pool',
            CRICKET: 'sports_cricket',
            VOLLEYBALL: 'sports_volleyball',
            SQUASH: 'sports_tennis',
        };
        return icons[sportType] || 'sports';
    };

    const hasBookingDetails = court && selectedDate && selectedSlots.length > 0;

    return (
        <div className="card overflow-hidden sticky top-24">
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-outline-variant/60">
                <span className="eyebrow">Summary</span>
                <h3 className="font-display text-xl font-semibold text-on-surface">Booking Summary</h3>
            </div>

            <div className="p-7 space-y-6">
                {/* Court Info */}
                {court && (
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-xl bg-primary-container/30 flex items-center justify-center shrink-0">
                            <Icon name={getSportIcon(court.sportType)} className="text-primary" size={28} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-semibold text-on-surface truncate">{court.name}</h4>
                            <p className="text-sm text-on-surface-variant capitalize">
                                {court.sportType?.toLowerCase().replace('_', ' ')}
                            </p>
                            {venue && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-variant">
                                    <Icon name="location_on" size={14} />
                                    <span className="truncate">{venue.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Booking Details */}
                {hasBookingDetails ? (
                    <>
                        <div className="space-y-3 pt-4 border-t border-outline-variant">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                                    <Icon name="calendar_today" className="text-on-surface-variant" size={20} />
                                </div>
                                <div>
                                    <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Date</p>
                                    <p className="text-sm font-semibold text-on-surface">{formatDate(selectedDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                                    <Icon name="schedule" className="text-on-surface-variant" size={20} />
                                </div>
                                <div>
                                    <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Time Slot</p>
                                    <p className="text-sm font-semibold text-on-surface">{getTimeRange()}</p>
                                    <p className="text-xs text-on-surface-variant">
                                        {duration} hour{duration > 1 ? 's' : ''} duration
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="pt-4 border-t border-outline-variant space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-on-surface-variant text-sm">
                                    Court Charges ({duration} hr × ₹{pricePerHour})
                                </span>
                                <span className="font-mono font-medium text-on-surface">₹{subtotal.toLocaleString()}</span>
                            </div>
                            {appliedDiscount > 0 && (
                                <div className="flex justify-between items-center text-primary">
                                    <span className="text-sm">Coupon Discount ({appliedCoupon?.code})</span>
                                    <span className="font-mono font-medium">-₹{appliedDiscount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <span className="text-on-surface-variant text-sm">Convenience Fee</span>
                                    <Icon name="info" size={14} className="text-outline" />
                                </div>
                                <span className="font-mono font-medium text-on-surface">₹{convenienceFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-on-surface-variant text-sm">GST (18%)</span>
                                <span className="font-mono font-medium text-on-surface">₹{gst.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="pt-4 border-t border-outline-variant">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-on-surface">Total Amount</span>
                                <span className="font-display font-semibold text-3xl text-on-surface">
                                    ₹{totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                            <Icon name="verified_user" className="text-primary" size={18} />
                            <div>
                                <p className="text-xs font-semibold text-on-surface">Secure Booking</p>
                                <p className="text-[10px] text-on-surface-variant">Your payment is protected</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                            <Icon name="calendar_today" className="text-outline" size={32} />
                        </div>
                        <p className="text-on-surface-variant text-sm">
                            Select a date and time slot to see your booking summary
                        </p>
                    </div>
                )}

                {/* Coupon Code Input */}
                {hasBookingDetails && (
                    <CouponInput
                        bookingAmount={subtotal}
                        sportType={court?.sportType}
                        onCouponApplied={handleCouponApplied}
                        onCouponRemoved={handleCouponRemoved}
                    />
                )}
            </div>
        </div>
    );
}

export default BookingSummary;
