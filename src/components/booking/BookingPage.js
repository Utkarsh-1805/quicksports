'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { PaymentForm } from '@/components/booking/PaymentForm';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * BookingPage Component
 * Multi-step booking flow for court reservations
 */
export default function BookingPage({ courtId, courtData, venueData }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Booking state
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [specialRequests, setSpecialRequests] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Booking creation state
    const [booking, setBooking] = useState(null);
    const [creatingBooking, setCreatingBooking] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    // Calculate price
    const pricePerHour = courtData?.pricePerHour || 0;
    const duration = selectedSlots.length;
    const subtotal = duration * pricePerHour;

    // Calculate total with fees (same formula as BookingSummary)
    const calculateTotalWithFees = (baseAmount) => {
        const convenienceFee = Math.round(baseAmount * 0.02); // 2% convenience fee
        const gst = Math.round((baseAmount + convenienceFee) * 0.18); // 18% GST
        return baseAmount + convenienceFee + gst;
    };

    // Steps configuration
    const steps = [
        { id: 1, label: 'Select' },
        { id: 2, label: 'Details' },
        { id: 3, label: 'Pay' },
    ];

    const canProceedStep1 = selectedDate && selectedSlots.length > 0;
    const canProceedStep2 = termsAccepted && user;

    // Handle date selection
    const handleDateSelect = useCallback((date) => {
        setSelectedDate(date);
        setSelectedSlots([]); // Reset slots when date changes
    }, []);

    // Handle slot selection
    const handleSlotSelect = useCallback((slots) => {
        setSelectedSlots(slots);
    }, []);

    // Create booking
    const createBooking = async () => {
        if (!user || !selectedDate || selectedSlots.length === 0) return;

        setCreatingBooking(true);
        setBookingError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to continue');
            }

            const sortedSlots = [...selectedSlots].sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courtId: courtId,
                    date: selectedDate,
                    startTime: sortedSlots[0].startTime,
                    endTime: sortedSlots[sortedSlots.length - 1].endTime
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create booking');
            }

            setBooking(data.booking);
            setCurrentStep(3);

        } catch (err) {
            console.error('Booking creation error:', err);
            setBookingError(err.message);
        } finally {
            setCreatingBooking(false);
        }
    };

    // Handle payment success
    const handlePaymentSuccess = (paymentData) => {
        router.push(`/booking/confirmation/${booking?.id || paymentData.bookingId}`);
    };

    // Handle payment error
    const handlePaymentError = (error) => {
        setBookingError(error);
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user && currentStep > 1) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/auth/login?redirect=${returnUrl}`);
        }
    }, [authLoading, user, currentStep, router]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStepClasses = (stepId) => {
        if (currentStep === stepId) {
            return 'bg-primary text-on-primary';
        }
        if (currentStep > stepId) {
            return 'bg-primary-container text-on-primary-container';
        }
        return 'bg-surface-container text-on-surface-variant';
    };

    return (
        <div className="min-h-screen bg-surface pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Navigation */}
                <Link
                    href={`/venues/${venueData?.id}`}
                    className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary font-medium mb-6 transition-colors"
                >
                    <Icon name="arrow_back" size={18} />
                    Back to venue
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <span className="eyebrow">Reserve</span>
                    <h1 className="font-display text-3xl md:text-4xl font-semibold text-on-surface tracking-tight mb-2">
                        Book Your Court
                    </h1>
                    <p className="text-on-surface-variant">Complete your booking in just a few steps</p>
                </div>

                {/* Progress Steps - Pills */}
                <div className="mb-10">
                    <div className="w-full max-w-3xl">
                        <div className="flex items-center gap-3 sm:gap-4">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${getStepClasses(step.id)}`}>
                                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-mono font-bold">
                                            {currentStep > step.id ? (
                                                <Icon name="check" size={14} />
                                            ) : (
                                                step.id
                                            )}
                                        </span>
                                        <span>{step.label}</span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300
                                            ${currentStep > step.id ? 'bg-primary' : 'bg-outline-variant'}
                                        `} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Court Info Card */}
                        <div className="card p-6">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-xl bg-primary-container/15 text-primary flex items-center justify-center text-4xl shrink-0">
                                    {courtData?.sportType === 'TENNIS' && '🎾'}
                                    {courtData?.sportType === 'BADMINTON' && '🏸'}
                                    {courtData?.sportType === 'BASKETBALL' && '🏀'}
                                    {courtData?.sportType === 'FOOTBALL' && '⚽'}
                                    {courtData?.sportType === 'TABLE_TENNIS' && '🏓'}
                                    {!['TENNIS', 'BADMINTON', 'BASKETBALL', 'FOOTBALL', 'TABLE_TENNIS'].includes(courtData?.sportType) && '🏆'}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h2 className="font-display text-xl font-semibold text-on-surface mb-1">{courtData?.name || 'Court'}</h2>
                                    <p className="text-sm text-on-surface-variant capitalize mb-2">
                                        {courtData?.sportType?.toLowerCase().replace('_', ' ')}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm flex-wrap">
                                        <div className="flex items-center gap-1 text-on-surface-variant">
                                            <Icon name="location_on" size={16} />
                                            {venueData?.name}, {venueData?.city}
                                        </div>
                                        <div className="text-primary font-mono font-bold">
                                            {formatCurrency(pricePerHour)}/hr
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Select Time */}
                        {currentStep === 1 && (
                            <>
                                <DatePicker
                                    selectedDate={selectedDate}
                                    onDateSelect={handleDateSelect}
                                />

                                <TimeSlotPicker
                                    courtId={courtId}
                                    selectedDate={selectedDate}
                                    selectedSlots={selectedSlots}
                                    onSlotSelect={handleSlotSelect}
                                    pricePerHour={pricePerHour}
                                />

                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => setCurrentStep(2)}
                                        disabled={!canProceedStep1}
                                        size="lg"
                                        className="px-8 bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container font-bold rounded-lg"
                                    >
                                        Continue to Details
                                        <Icon name="chevron_right" size={20} className="ml-2" />
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 2: User Details */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* User Details Form */}
                                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary flex items-center justify-center">
                                            <Icon name="person" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-on-surface">Your Details</h3>
                                            <p className="text-sm text-on-surface-variant">Confirm your contact information</p>
                                        </div>
                                    </div>

                                    {authLoading ? (
                                        <div className="py-8 flex items-center justify-center">
                                            <Icon name="progress_activity" size={24} className="animate-spin text-primary" />
                                        </div>
                                    ) : user ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                                                <Icon name="person" size={20} className="text-on-surface-variant" />
                                                <div>
                                                    <p className="text-xs text-on-surface-variant uppercase font-medium">Name</p>
                                                    <p className="font-semibold text-on-surface">{user.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                                                <Icon name="mail" size={20} className="text-on-surface-variant" />
                                                <div>
                                                    <p className="text-xs text-on-surface-variant uppercase font-medium">Email</p>
                                                    <p className="font-semibold text-on-surface">{user.email}</p>
                                                </div>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                                                    <Icon name="phone" size={20} className="text-on-surface-variant" />
                                                    <div>
                                                        <p className="text-xs text-on-surface-variant uppercase font-medium">Phone</p>
                                                        <p className="font-semibold text-on-surface">{user.phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-on-surface-variant mb-4">Please login to continue with your booking</p>
                                            <Link href={`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                                                <Button>Login to Continue</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Special Requests */}
                                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Icon name="chat_bubble_outline" size={20} className="text-on-surface-variant" />
                                        <h3 className="font-semibold text-on-surface">Special Requests (Optional)</h3>
                                    </div>
                                    <textarea
                                        value={specialRequests}
                                        onChange={(e) => setSpecialRequests(e.target.value)}
                                        placeholder="Any special requirements or notes for your booking..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-on-surface-variant/60 text-on-surface"
                                    />
                                </div>

                                {/* Terms & Conditions */}
                                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-5 h-5 border-2 border-outline rounded peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                                                {termsAccepted && (
                                                    <Icon name="check" size={14} className="text-on-primary" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-on-surface-variant">
                                            I agree to the{' '}
                                            <Link href="/terms" className="text-primary hover:underline font-medium">
                                                Terms & Conditions
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="/privacy" className="text-primary hover:underline font-medium">
                                                Privacy Policy
                                            </Link>
                                            . I understand that my booking is subject to availability and the venue&apos;s cancellation policy.
                                        </div>
                                    </label>
                                </div>

                                {/* Error Message */}
                                {bookingError && (
                                    <div className="p-4 bg-error-container border border-error/30 rounded-xl flex items-center gap-3">
                                        <Icon name="error" size={20} className="text-error shrink-0" />
                                        <p className="text-error">{bookingError}</p>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex justify-between gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(1)}
                                        className="px-6"
                                    >
                                        <Icon name="arrow_back" size={16} className="mr-2" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={createBooking}
                                        disabled={!canProceedStep2 || creatingBooking}
                                        loading={creatingBooking}
                                        size="lg"
                                        className="px-8 bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container font-bold rounded-lg"
                                    >
                                        Proceed to Payment
                                        <Icon name="chevron_right" size={20} className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {currentStep === 3 && booking && (
                            <div className="space-y-6">
                                {/* Booking Created Success */}
                                <div className="bg-primary-container/15 border border-primary/30 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Icon name="check_circle" size={24} className="text-primary" />
                                        <h3 className="font-bold text-primary">Booking Reserved!</h3>
                                    </div>
                                    <p className="text-on-surface-variant text-sm">
                                        Your slot has been temporarily reserved. Complete payment within 10 minutes to confirm your booking.
                                    </p>
                                </div>

                                <PaymentForm
                                    booking={booking}
                                    user={user}
                                    totalWithFees={calculateTotalWithFees(booking?.totalAmount || 0)}
                                    onPaymentSuccess={handlePaymentSuccess}
                                    onPaymentError={handlePaymentError}
                                />

                                {/* Back Button */}
                                <div className="flex justify-start">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setCurrentStep(2)}
                                        className="text-on-surface-variant"
                                    >
                                        <Icon name="arrow_back" size={16} className="mr-2" />
                                        Back to details
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Booking Summary */}
                    <div className="lg:col-span-1">
                        <BookingSummary
                            court={courtData}
                            venue={venueData}
                            selectedDate={selectedDate}
                            selectedSlots={selectedSlots}
                            pricePerHour={pricePerHour}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
