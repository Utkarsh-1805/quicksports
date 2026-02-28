'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    MapPin, 
    Star, 
    AlertCircle, 
    Loader2, 
    CheckCircle2,
    ChevronRight,
    User,
    Mail,
    Phone,
    MessageSquare,
    Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DatePicker } from '@/components/booking/DatePicker';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { BookingSummary } from '@/components/booking/BookingSummary';
import { PaymentForm } from '@/components/booking/PaymentForm';
import { Button } from '@/components/ui/Button';

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
        { id: 1, label: 'Select Time', icon: '📅' },
        { id: 2, label: 'Your Details', icon: '👤' },
        { id: 3, label: 'Payment', icon: '💳' },
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Back Navigation */}
                <Link 
                    href={`/venues/${venueData?.id}`}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 font-medium mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to venue
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                        Book Your Court
                    </h1>
                    <p className="text-slate-600">Complete your booking in just a few steps</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-10">
                    <div className="flex items-center justify-between max-w-xl">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all duration-300
                                        ${currentStep >= step.id 
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-500/30' 
                                            : 'bg-slate-100 text-slate-400'
                                        }
                                        ${currentStep === step.id ? 'scale-110 ring-4 ring-green-100' : ''}
                                    `}>
                                        {currentStep > step.id ? (
                                            <CheckCircle2 className="w-6 h-6" />
                                        ) : (
                                            step.icon
                                        )}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-green-600' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-20 sm:w-32 h-1 mx-2 rounded-full transition-colors duration-300
                                        ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'}
                                    `} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Court Info Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-4xl shrink-0">
                                    {courtData?.sportType === 'TENNIS' && '🎾'}
                                    {courtData?.sportType === 'BADMINTON' && '🏸'}
                                    {courtData?.sportType === 'BASKETBALL' && '🏀'}
                                    {courtData?.sportType === 'FOOTBALL' && '⚽'}
                                    {courtData?.sportType === 'TABLE_TENNIS' && '🏓'}
                                    {!['TENNIS', 'BADMINTON', 'BASKETBALL', 'FOOTBALL', 'TABLE_TENNIS'].includes(courtData?.sportType) && '🏆'}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">{courtData?.name || 'Court'}</h2>
                                    <p className="text-sm text-slate-500 capitalize mb-2">
                                        {courtData?.sportType?.toLowerCase().replace('_', ' ')}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {venueData?.name}, {venueData?.city}
                                        </div>
                                        <div className="text-green-600 font-bold">
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
                                        className="px-8"
                                    >
                                        Continue to Details
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 2: User Details */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* User Details Form */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                            <User className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Your Details</h3>
                                            <p className="text-sm text-slate-500">Confirm your contact information</p>
                                        </div>
                                    </div>

                                    {authLoading ? (
                                        <div className="py-8 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                                        </div>
                                    ) : user ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                                <User className="w-5 h-5 text-slate-500" />
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-medium">Name</p>
                                                    <p className="font-semibold text-slate-800">{user.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                                <Mail className="w-5 h-5 text-slate-500" />
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-medium">Email</p>
                                                    <p className="font-semibold text-slate-800">{user.email}</p>
                                                </div>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                                    <Phone className="w-5 h-5 text-slate-500" />
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase font-medium">Phone</p>
                                                        <p className="font-semibold text-slate-800">{user.phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-slate-600 mb-4">Please login to continue with your booking</p>
                                            <Link href={`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                                                <Button>Login to Continue</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Special Requests */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <MessageSquare className="w-5 h-5 text-slate-500" />
                                        <h3 className="font-semibold text-slate-900">Special Requests (Optional)</h3>
                                    </div>
                                    <textarea
                                        value={specialRequests}
                                        onChange={(e) => setSpecialRequests(e.target.value)}
                                        placeholder="Any special requirements or notes for your booking..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 text-slate-800"
                                    />
                                </div>

                                {/* Terms & Conditions */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:border-green-500 peer-checked:bg-green-500 transition-all">
                                                {termsAccepted && (
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            I agree to the{' '}
                                            <Link href="/terms" className="text-green-600 hover:underline font-medium">
                                                Terms & Conditions
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="/privacy" className="text-green-600 hover:underline font-medium">
                                                Privacy Policy
                                            </Link>
                                            . I understand that my booking is subject to availability and the venue's cancellation policy.
                                        </div>
                                    </label>
                                </div>

                                {/* Error Message */}
                                {bookingError && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                        <p className="text-red-700">{bookingError}</p>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex justify-between gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(1)}
                                        className="px-6"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={createBooking}
                                        disabled={!canProceedStep2 || creatingBooking}
                                        loading={creatingBooking}
                                        size="lg"
                                        className="px-8"
                                    >
                                        Proceed to Payment
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {currentStep === 3 && booking && (
                            <div className="space-y-6">
                                {/* Booking Created Success */}
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                        <h3 className="font-bold text-green-800">Booking Reserved!</h3>
                                    </div>
                                    <p className="text-green-700 text-sm">
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
                                        className="text-slate-600"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
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
