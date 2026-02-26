'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    MapPin,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Ticket,
    ChevronRight,
    Filter,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * MyBookingsPage Component
 * Displays user's booking history with filters
 */
export default function MyBookingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, upcoming, past
    const [statusFilter, setStatusFilter] = useState('all'); // all, CONFIRMED, PENDING, CANCELLED, COMPLETED

    // Fetch bookings
    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/bookings');
            return;
        }

        fetchBookings();
    }, [user, authLoading, filter, statusFilter]);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view bookings');
            }

            let url = '/api/bookings?';
            const params = new URLSearchParams();
            
            if (filter === 'upcoming') {
                params.append('upcoming', 'true');
            } else if (filter === 'past') {
                params.append('upcoming', 'false');
            }
            
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            params.append('limit', '50');

            const res = await fetch(`${url}${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setBookings(data.bookings || []);
            } else {
                throw new Error(data.message || 'Failed to load bookings');
            }
        } catch (err) {
            console.error('Fetch bookings error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return <CheckCircle2 className="w-4 h-4" />;
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'CANCELLED':
                return <XCircle className="w-4 h-4" />;
            case 'COMPLETED':
                return <CheckCircle2 className="w-4 h-4" />;
            default:
                return <Ticket className="w-4 h-4" />;
        }
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

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-32 pb-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">My Bookings</h1>
                        <p className="text-slate-600">View and manage your court reservations</p>
                    </div>
                    <Link href="/venues">
                        <Button>
                            Book a Court
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2 block">Time</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'upcoming', label: 'Upcoming' },
                                { value: 'past', label: 'Past' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilter(option.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filter === option.value
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2 block">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'CONFIRMED', label: 'Confirmed' },
                                { value: 'PENDING', label: 'Pending' },
                                { value: 'COMPLETED', label: 'Completed' },
                                { value: 'CANCELLED', label: 'Cancelled' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setStatusFilter(option.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        statusFilter === option.value
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={fetchBookings}
                        className="self-end p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-1/3 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <Link
                                key={booking.id}
                                href={booking.status === 'CONFIRMED' ? `/booking/confirmation/${booking.id}` : '#'}
                                className={`block bg-white rounded-2xl border border-slate-200 p-6 hover:border-green-300 hover:shadow-lg transition-all ${
                                    booking.status !== 'CONFIRMED' ? 'cursor-default' : ''
                                }`}
                            >
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Sport Icon */}
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-3xl shrink-0">
                                        {getSportIcon(booking.court?.sportType)}
                                    </div>

                                    {/* Booking Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{booking.court?.name}</h3>
                                                <p className="text-sm text-slate-500">{booking.court?.facility?.name}</p>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {formatDate(booking.date)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                {booking.court?.facility?.city}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="md:text-right">
                                        <p className="text-2xl font-bold text-green-600">₹{booking.totalAmount?.toLocaleString()}</p>
                                        {booking.status === 'CONFIRMED' && (
                                            <p className="text-xs text-green-600 font-medium">View Details →</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No bookings found</h3>
                        <p className="text-slate-500 mb-6">
                            {filter === 'upcoming' 
                                ? "You don't have any upcoming bookings"
                                : filter === 'past'
                                ? "You don't have any past bookings"
                                : "You haven't made any bookings yet"
                            }
                        </p>
                        <Link href="/venues">
                            <Button>Explore Venues</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
