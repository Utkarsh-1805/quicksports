'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import QRCode from 'qrcode';
import OpenToOthersCard from '@/components/booking/OpenToOthersCard';

/**
 * BookingConfirmation Component
 * Displays booking success with all details and actions
 */
export default function BookingConfirmation({ booking, payment }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const qrRef = useRef(null);

    // Generate QR Code
    useEffect(() => {
        const generateQR = async () => {
            if (booking?.id) {
                try {
                    const url = await QRCode.toDataURL(
                        JSON.stringify({
                            bookingId: booking.id,
                            court: booking.court?.name,
                            date: booking.date,
                            time: `${booking.startTime}-${booking.endTime}`,
                            venue: booking.court?.facility?.name
                        }),
                        {
                            width: 200,
                            margin: 2,
                            color: {
                                dark: '#006b2c',
                                light: '#ffffff'
                            }
                        }
                    );
                    setQrCodeUrl(url);
                } catch (err) {
                    console.error('QR generation failed:', err);
                }
            }
        };
        generateQR();
    }, [booking]);

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

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const copyBookingId = () => {
        navigator.clipboard.writeText(booking?.id || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareBooking = async () => {
        const shareData = {
            title: 'My QuickCourt Booking',
            text: `I've booked ${booking?.court?.name} at ${booking?.court?.facility?.name} on ${formatDate(booking?.date)} from ${formatTime(booking?.startTime)} to ${formatTime(booking?.endTime)}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            copyBookingId();
        }
    };

    const addToCalendar = () => {
        if (!booking) return;

        const startDateTime = new Date(`${booking.date}T${booking.startTime}`);
        const endDateTime = new Date(`${booking.date}T${booking.endTime}`);

        const formatForCalendar = (date) => {
            return date.toISOString().replace(/-|:|\.\d{3}/g, '');
        };

        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Court Booking - ${booking.court?.name}`)}&dates=${formatForCalendar(startDateTime)}/${formatForCalendar(endDateTime)}&details=${encodeURIComponent(`Booking at ${booking.court?.facility?.name}\nBooking ID: ${booking.id}`)}&location=${encodeURIComponent(`${booking.court?.facility?.address}, ${booking.court?.facility?.city}`)}`;

        window.open(calendarUrl, '_blank');
    };

    const downloadReceipt = async () => {
        try {
            // Fetch receipt with auth token
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/bookings/${booking?.id}/receipt`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch receipt');
            }

            const html = await response.text();

            // Open new window and write HTML directly
            const receiptWindow = window.open('', '_blank');
            if (receiptWindow) {
                receiptWindow.document.write(html);
                receiptWindow.document.close();
            } else {
                // Popup blocked - fallback
                downloadReceiptText();
            }
        } catch (error) {
            console.error('Error downloading receipt:', error);
            // Fallback to text receipt
            downloadReceiptText();
        }
    };

    const downloadReceiptText = () => {
        // Calculate fee breakdown
        const baseAmount = booking?.totalAmount || 0;
        const totalPaid = payment?.amount || baseAmount;
        const fees = totalPaid - baseAmount;

        // Create a simple text receipt as fallback
        const receipt = `
QUICKCOURT BOOKING RECEIPT
===========================

Booking ID: ${booking?.id}
Date: ${formatDate(booking?.date)}
Time: ${formatTime(booking?.startTime)} - ${formatTime(booking?.endTime)}

Court: ${booking?.court?.name}
Sport: ${booking?.court?.sportType}
Venue: ${booking?.court?.facility?.name}
Address: ${booking?.court?.facility?.address}, ${booking?.court?.facility?.city}

---------------------------
PAYMENT DETAILS
---------------------------
Court Booking:          ₹${baseAmount.toLocaleString()}
GST & Convenience Fee:  ₹${fees.toLocaleString()}
---------------------------
Total Paid:             ₹${totalPaid.toLocaleString()}
---------------------------

Payment ID: ${payment?.paymentId || 'N/A'}
Payment Method: ${payment?.method || 'N/A'}

Thank you for booking with QuickCourt!
        `.trim();

        const blob = new Blob([receipt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuickCourt-Receipt-${booking?.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
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
            'VOLLEYBALL': '🏐'
        };
        return icons[sportType] || '🏆';
    };

    if (!booking) {
        return (
            <div className="min-h-screen bg-surface pt-32 pb-20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="receipt" size={32} className="text-on-surface-variant" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">Booking Not Found</h2>
                    <p className="text-on-surface-variant mb-6">We couldn&apos;t find this booking</p>
                    <Link href="/venues">
                        <Button>Browse Venues</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const baseAmount = booking.totalAmount || 0;
    const totalPaid = payment?.amount || baseAmount;
    const fees = totalPaid - baseAmount;

    return (
        <div className="min-h-screen bg-surface pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Success Animation Header */}
                <section className="flex flex-col items-center text-center gap-4 mb-10 page-enter">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary-container/40 animate-ping" style={{ animationDuration: '3s' }}></div>
                        <div className="relative w-20 h-20 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-sm">
                            <Icon name="check_circle" size={48} filled />
                        </div>
                    </div>
                    <div>
                        <span className="eyebrow">Confirmed</span>
                        <h1 className="font-display text-5xl md:text-6xl font-semibold text-on-surface tracking-tight">
                            Confirmed.
                        </h1>
                        <p className="text-on-surface-variant mt-3 max-w-md mx-auto">
                            Your court is secured. Present the QR code below upon arrival at the venue.
                        </p>
                    </div>
                </section>

                {/* Bento Grid Content */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                    {/* QR Code Card (Left) */}
                    <div className="lg:col-span-4 card p-6 text-center flex flex-col items-center justify-center">
                        <h2 className="font-display text-xl font-semibold text-on-surface mb-6">Venue Check-In</h2>
                        {qrCodeUrl ? (
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-outline-variant mb-4 w-full aspect-square relative max-w-[240px]">
                                <img src={qrCodeUrl} alt="Booking QR Code" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant mb-4 w-full aspect-square max-w-[240px] flex items-center justify-center">
                                <Icon name="qr_code_2" size={120} className="text-on-surface-variant/40" />
                            </div>
                        )}
                        <p className="text-sm text-on-surface-variant flex items-center gap-1 flex-wrap justify-center">
                            Booking ID:
                            <span className="font-mono text-on-surface ml-1">{booking.id}</span>
                            <button
                                onClick={copyBookingId}
                                className="ml-1 p-1 rounded hover:bg-surface-container transition-colors"
                                aria-label="Copy booking ID"
                            >
                                {copied ? (
                                    <Icon name="check" size={16} className="text-primary" />
                                ) : (
                                    <Icon name="content_copy" size={16} className="text-on-surface-variant" />
                                )}
                            </button>
                        </p>
                    </div>

                    {/* Details & Actions (Right) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Booking Details Card */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
                                <h2 className="font-display text-xl font-semibold text-on-surface">Reservation Details</h2>
                                <span className="pill">
                                    Confirmed
                                </span>
                            </div>

                            {/* Sport / Venue Header */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-primary-container/10 rounded-xl border border-outline-variant">
                                <div className="w-14 h-14 bg-primary-container/20 rounded-xl flex items-center justify-center text-3xl shrink-0">
                                    {getSportIcon(booking.court?.sportType)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-on-surface">{booking.court?.name}</h3>
                                    <p className="text-sm text-on-surface-variant capitalize">
                                        {booking.court?.sportType?.toLowerCase().replace('_', ' ')}
                                    </p>
                                </div>
                            </div>

                            {/* Detail Rows */}
                            <div className="space-y-0">
                                <div className="flex justify-between border-b border-outline-variant py-3 text-sm">
                                    <span className="text-on-surface-variant">Venue</span>
                                    <span className="text-on-surface font-medium text-right">{booking.court?.facility?.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-outline-variant py-3 text-sm">
                                    <span className="text-on-surface-variant flex items-center gap-1">
                                        <Icon name="location_on" size={16} />
                                        Address
                                    </span>
                                    <span className="text-on-surface font-medium text-right max-w-[60%]">
                                        {booking.court?.facility?.address}, {booking.court?.facility?.city}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-outline-variant py-3 text-sm">
                                    <span className="text-on-surface-variant flex items-center gap-1">
                                        <Icon name="calendar_today" size={16} />
                                        Date
                                    </span>
                                    <span className="text-on-surface font-mono font-medium">{formatDate(booking.date)}</span>
                                </div>
                                <div className="flex justify-between border-b border-outline-variant py-3 text-sm">
                                    <span className="text-on-surface-variant flex items-center gap-1">
                                        <Icon name="schedule" size={16} />
                                        Time
                                    </span>
                                    <span className="text-on-surface font-mono font-medium">
                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </span>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="flex justify-between border-b border-outline-variant py-3 text-sm">
                                    <span className="text-on-surface-variant">Court Booking</span>
                                    <span className="text-on-surface font-mono font-medium">₹{baseAmount.toLocaleString()}</span>
                                </div>
                                {fees > 0 && (
                                    <div className="flex justify-between border-b border-outline-variant py-3 text-sm">
                                        <span className="text-on-surface-variant">GST & Convenience Fee</span>
                                        <span className="text-on-surface font-mono font-medium">₹{fees.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4 mt-2 border-t border-dashed border-outline-variant">
                                    <span className="text-sm text-on-surface-variant">Total Amount Paid</span>
                                    <span className="font-mono text-on-surface text-xl font-bold">₹{totalPaid.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-center mt-6">
                                <div className="px-4 py-2 bg-primary-container/30 text-primary text-sm font-bold rounded-full flex items-center gap-2">
                                    <Icon name="check_circle" size={16} />
                                    PAYMENT SUCCESSFUL
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                onClick={addToCalendar}
                                className="btn btn-outline"
                            >
                                <Icon name="calendar_today" size={20} className="text-primary" />
                                <span className="hidden sm:inline">Calendar</span>
                            </button>
                            <button
                                onClick={shareBooking}
                                className="btn btn-outline"
                            >
                                <Icon name="share" size={20} className="text-primary" />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                            <button
                                onClick={downloadReceipt}
                                className="btn btn-outline"
                            >
                                <Icon name="download" size={20} className="text-primary" />
                                <span className="hidden sm:inline">Receipt</span>
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="btn btn-outline"
                            >
                                <Icon name="print" size={20} className="text-primary" />
                                <span className="hidden sm:inline">Print</span>
                            </button>
                        </div>
                    </div>

                    {/* Match-making — open this booking to other players */}
                    <div className="lg:col-span-12 mt-2">
                        <OpenToOthersCard booking={booking} />
                    </div>

                    {/* Rate Venue Upsell */}
                    <div className="lg:col-span-12 card p-6 flex flex-col md:flex-row items-center justify-between gap-6 mt-2">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                            <h3 className="font-display text-lg font-semibold text-on-surface">Rate this venue after your visit</h3>
                            <p className="text-sm text-on-surface-variant">Help other athletes find the best spots to play.</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className="p-2 text-outline-variant hover:text-secondary-container transition-colors cursor-pointer"
                                >
                                    <Icon name="star" size={28} />
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact Support */}
                <div className="card p-6 mt-8 mb-8">
                    <h3 className="font-display text-lg font-semibold text-on-surface mb-4">Need Help?</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a
                            href="tel:+919999900000"
                            className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors flex-1 border border-outline-variant"
                        >
                            <Icon name="call" size={20} className="text-primary" />
                            <div>
                                <p className="text-xs text-on-surface-variant">Call Support</p>
                                <p className="font-semibold text-on-surface">+91 99999 00000</p>
                            </div>
                        </a>
                        <a
                            href="mailto:support@quickcourt.in"
                            className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors flex-1 border border-outline-variant"
                        >
                            <Icon name="mail" size={20} className="text-primary" />
                            <div>
                                <p className="text-xs text-on-surface-variant">Email Us</p>
                                <p className="font-semibold text-on-surface">support@quickcourt.in</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/venues" className="flex-1">
                        <Button variant="outline" fullWidth size="lg">
                            Book Another Court
                            <Icon name="arrow_forward" size={20} className="ml-2" />
                        </Button>
                    </Link>
                    <Link href="/dashboard" className="flex-1">
                        <Button
                            fullWidth
                            size="lg"
                            className="bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container font-bold rounded-lg"
                        >
                            View My Bookings
                        </Button>
                    </Link>
                </div>

                {/* Return Action */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/dashboard"
                        className="text-sm text-primary hover:text-primary-container transition-colors font-medium hover:underline flex items-center gap-1"
                    >
                        <Icon name="arrow_back" size={18} />
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
