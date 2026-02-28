'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Calendar, 
    Clock, 
    MapPin,
    Loader2, 
    AlertCircle, 
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCw,
    Download,
    XCircle,
    CheckCircle2,
    Ticket,
    Search,
    SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';

/**
 * MyBookingsPage Component
 * Full booking history with filtering, pagination, and actions
 */
export default function MyBookingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    
    // Filters
    const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    
    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/dashboard/bookings');
            return;
        }

        fetchBookings();
    }, [user, authLoading, activeFilter, statusFilter, pagination.page]);

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

            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());
            
            if (activeFilter === 'upcoming') {
                params.append('upcoming', 'true');
            } else if (activeFilter === 'past') {
                params.append('upcoming', 'false');
            }
            
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const res = await fetch(`/api/bookings?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setBookings(data.bookings || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination?.total || data.bookings?.length || 0,
                    totalPages: data.pagination?.pages || Math.ceil((data.bookings?.length || 0) / prev.limit)
                }));
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

    const handleCancelBooking = async () => {
        if (!bookingToCancel) return;
        
        setCancellingId(bookingToCancel.id);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/bookings/${bookingToCancel.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reason: cancelReason || 'User requested cancellation'
                })
            });

            const data = await res.json();

            if (data.success) {
                // Update the booking in the list
                setBookings(prev => prev.map(b => 
                    b.id === bookingToCancel.id ? { ...b, status: 'CANCELLED' } : b
                ));
                setShowCancelModal(false);
                setBookingToCancel(null);
                setCancelReason('');
            } else {
                throw new Error(data.message || 'Failed to cancel booking');
            }
        } catch (err) {
            console.error('Cancel booking error:', err);
            setError(err.message);
        } finally {
            setCancellingId(null);
        }
    };

    const handleDownloadReceipt = async (bookingId) => {
        try {
            // Fetch receipt with auth token
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/bookings/${bookingId}/receipt`, {
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
                // Popup blocked - fallback to confirmation page
                window.open(`/booking/confirmation/${bookingId}`, '_blank');
            }
        } catch (error) {
            console.error('Error downloading receipt:', error);
            // Fallback to confirmation page
            window.open(`/booking/confirmation/${bookingId}`, '_blank');
        }
    };

    const openCancelModal = (booking) => {
        setBookingToCancel(booking);
        setShowCancelModal(true);
    };

    const filterTabs = [
        { value: 'all', label: 'All Bookings', count: null },
        { value: 'upcoming', label: 'Upcoming', count: null },
        { value: 'past', label: 'Past', count: null }
    ];

    const statusTabs = [
        { value: 'all', label: 'All Status' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' }
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                            <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-slate-900">My Bookings</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900">My Bookings</h1>
                    </div>
                    <Link href="/venues">
                        <Button>
                            <Calendar className="w-4 h-4 mr-2" />
                            Book New Court
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Time Filter */}
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2 block">Time Period</label>
                            <div className="flex gap-2">
                                {filterTabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => {
                                            setActiveFilter(tab.value);
                                            setPagination(prev => ({ ...prev, page: 1 }));
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            activeFilter === tab.value
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex-1">
                            <label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => {
                                            setStatusFilter(tab.value);
                                            setPagination(prev => ({ ...prev, page: 1 }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            statusFilter === tab.value
                                                ? 'bg-green-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={fetchBookings}
                            disabled={loading}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors self-end"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-red-700">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-slate-200 rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-1/3 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-4 w-1/2 bg-slate-100 rounded mb-4"></div>
                                        <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : bookings.length > 0 ? (
                    <>
                        {/* Booking List */}
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    variant="detailed"
                                    onCancel={openCancelModal}
                                    onDownload={handleDownloadReceipt}
                                    showActions={true}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-8 bg-white rounded-xl border border-slate-200 p-4">
                                <p className="text-sm text-slate-500">
                                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                                    <span className="font-medium">{pagination.total}</span> bookings
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum = i + 1;
                                            if (pagination.totalPages > 5) {
                                                if (pagination.page > 3) {
                                                    pageNum = pagination.page - 2 + i;
                                                }
                                                if (pageNum > pagination.totalPages) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                }
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                                        pagination.page === pageNum
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Bookings Found</h3>
                        <p className="text-slate-500 mb-6">
                            {activeFilter === 'upcoming' 
                                ? "You don't have any upcoming bookings"
                                : activeFilter === 'past'
                                ? "You don't have any past bookings"
                                : "You haven't made any bookings yet"
                            }
                        </p>
                        <Link href="/venues">
                            <Button>
                                <Search className="w-4 h-4 mr-2" />
                                Find a Court
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Cancel Booking Modal */}
            {showCancelModal && bookingToCancel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Cancel Booking?</h3>
                        <p className="text-slate-500 text-center mb-6">
                            Are you sure you want to cancel your booking for <strong>{bookingToCancel.court?.name}</strong>?
                            This action cannot be undone.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Reason for cancellation (optional)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Let us know why you're cancelling..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setBookingToCancel(null);
                                    setCancelReason('');
                                }}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Keep Booking
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={cancellingId === bookingToCancel.id}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {cancellingId === bookingToCancel.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
