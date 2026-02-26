'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    CheckCircle2,
    Calendar,
    Clock,
    MapPin,
    Download,
    Share2,
    CalendarPlus,
    Ticket,
    ArrowRight,
    Copy,
    Check,
    QrCode,
    Star,
    Phone,
    Mail,
    Printer
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import QRCode from 'qrcode';

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
                                dark: '#16a34a',
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

    const downloadReceipt = () => {
        // Create a simple text receipt (in production, generate PDF)
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

Amount Paid: ₹${booking?.totalAmount?.toLocaleString()}
Payment ID: ${payment?.paymentId || 'N/A'}

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
            <div className="min-h-screen bg-slate-50 pt-32 pb-20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Booking Not Found</h2>
                    <p className="text-slate-500 mb-6">We couldn't find this booking</p>
                    <Link href="/venues">
                        <Button>Browse Venues</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-slate-50 pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* Success Animation Header */}
                <div className="text-center mb-10">
                    <div className="relative inline-flex mb-6">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
                        Booking Confirmed! 🎉
                    </h1>
                    <p className="text-slate-600 text-lg">
                        You're all set! We've sent a confirmation to your email.
                    </p>
                </div>

                {/* Booking Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8">
                    
                    {/* Header with Sport Icon */}
                    <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        
                        <div className="relative flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                                {getSportIcon(booking.court?.sportType)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{booking.court?.name}</h2>
                                <p className="text-green-100 capitalize">{booking.court?.sportType?.toLowerCase().replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-6 space-y-6">
                        
                        {/* Booking ID */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Ticket className="w-5 h-5 text-slate-500" />
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase">Booking ID</p>
                                    <p className="font-mono font-bold text-slate-800">{booking.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={copyBookingId}
                                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-500" />}
                            </button>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase">Date</p>
                                    <p className="font-bold text-slate-800">{formatDate(booking.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase">Time</p>
                                    <p className="font-bold text-slate-800">
                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Venue */}
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium uppercase">Venue</p>
                                <p className="font-bold text-slate-800">{booking.court?.facility?.name}</p>
                                <p className="text-sm text-slate-500">
                                    {booking.court?.facility?.address}, {booking.court?.facility?.city}
                                </p>
                            </div>
                        </div>

                        {/* Amount Paid */}
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                            <div>
                                <p className="text-xs text-green-600 font-medium uppercase">Amount Paid</p>
                                <p className="text-2xl font-bold text-green-700">₹{booking.totalAmount?.toLocaleString()}</p>
                            </div>
                            <div className="px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded-full">
                                PAID
                            </div>
                        </div>

                        {/* QR Code */}
                        {qrCodeUrl && (
                            <div className="flex flex-col items-center py-6 border-t border-dashed border-slate-200">
                                <p className="text-sm text-slate-500 mb-3">Show this QR code at the venue</p>
                                <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-lg">
                                    <img src={qrCodeUrl} alt="Booking QR Code" className="w-40 h-40" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-100 p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                onClick={addToCalendar}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 transition-colors"
                            >
                                <CalendarPlus className="w-6 h-6" />
                                <span className="text-xs font-medium">Add to Calendar</span>
                            </button>
                            <button
                                onClick={shareBooking}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 transition-colors"
                            >
                                <Share2 className="w-6 h-6" />
                                <span className="text-xs font-medium">Share</span>
                            </button>
                            <button
                                onClick={downloadReceipt}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 transition-colors"
                            >
                                <Download className="w-6 h-6" />
                                <span className="text-xs font-medium">Receipt</span>
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 transition-colors"
                            >
                                <Printer className="w-6 h-6" />
                                <span className="text-xs font-medium">Print</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
                    <h3 className="font-bold text-slate-900 mb-4">Need Help?</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a 
                            href="tel:+919999900000"
                            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-green-50 rounded-xl transition-colors flex-1"
                        >
                            <Phone className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-xs text-slate-400">Call Support</p>
                                <p className="font-semibold text-slate-700">+91 99999 00000</p>
                            </div>
                        </a>
                        <a 
                            href="mailto:support@quickcourt.in"
                            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-green-50 rounded-xl transition-colors flex-1"
                        >
                            <Mail className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-xs text-slate-400">Email Us</p>
                                <p className="font-semibold text-slate-700">support@quickcourt.in</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/venues" className="flex-1">
                        <Button variant="outline" fullWidth size="lg">
                            Book Another Court
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="/dashboard" className="flex-1">
                        <Button fullWidth size="lg">
                            View My Bookings
                        </Button>
                    </Link>
                </div>

                {/* Rating Prompt */}
                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm mb-3">How was your booking experience?</p>
                    <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-yellow-100 flex items-center justify-center transition-colors group"
                            >
                                <Star className="w-5 h-5 text-slate-300 group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
