'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from '@/components/dashboard';
import { Icon } from '@/components/ui/Icon';

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
    const [refundStatus, setRefundStatus] = useState(null); // { state: 'success'|'partial'|'none', ...details }

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
        setRefundStatus(null);

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

            if (!data.success) {
                throw new Error(data.message || 'Failed to cancel booking');
            }

            // Update local booking state
            setBookings(prev => prev.map(b =>
                b.id === bookingToCancel.id ? { ...b, status: 'CANCELLED' } : b
            ));

            // If a refund is owed AND a payment was made, automatically request the refund
            const paymentId = bookingToCancel.payment?.id || bookingToCancel.paymentId;
            const refundPct = data.refund?.refundPercentage ?? 0;
            const wasPaid = !!data.refund?.wasPaymentMade;

            if (wasPaid && refundPct > 0 && paymentId) {
                try {
                    const refundRes = await fetch('/api/payments/refund', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            paymentId,
                            reason: cancelReason || 'User requested cancellation'
                        })
                    });
                    const refundData = await refundRes.json();
                    if (refundRes.ok && refundData.success) {
                        setRefundStatus({
                            state: refundPct === 100 ? 'success' : 'partial',
                            amount: refundData.data?.amount ?? data.refund.refundAmount,
                            percentage: refundData.data?.percentage ?? refundPct,
                            estimatedDays: refundData.data?.estimatedProcessingTime || '5–7 business days',
                            policy: data.refund?.policy
                        });
                    } else {
                        setRefundStatus({
                            state: 'failed',
                            message: refundData.error || refundData.details || 'Refund could not be initiated. Contact support.'
                        });
                    }
                } catch (refundErr) {
                    console.error('Refund request error:', refundErr);
                    setRefundStatus({
                        state: 'failed',
                        message: 'Refund request failed. Contact support to claim your refund.'
                    });
                }
            } else if (wasPaid && refundPct === 0) {
                setRefundStatus({
                    state: 'none',
                    policy: data.refund?.policy || 'No refund - cancelled too close to booking time'
                });
            }

            setShowCancelModal(false);
            setBookingToCancel(null);
            setCancelReason('');
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

    const handleReviewBooking = (booking) => {
        const facilityId = booking?.venue?.id || booking?.court?.facilityId || booking?.court?.facility?.id;

        if (!facilityId) {
            setError('Venue details not found for this booking.');
            return;
        }

        router.push(`/venues/${facilityId}?writeReview=1#reviews-section`);
    };

    const openCancelModal = (booking) => {
        setBookingToCancel(booking);
        setShowCancelModal(true);
    };

    const filterTabs = [
        { value: 'all', label: 'All Bookings' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'past', label: 'Past' }
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
            <div className="min-h-screen bg-surface pt-28 pb-12 flex items-center justify-center">
                <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Refund status banner (appears after cancel) */}
                {refundStatus && (
                    <div
                        className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${
                            refundStatus.state === 'success'
                                ? 'bg-primary-container/40 border-primary/30 text-on-primary-container'
                                : refundStatus.state === 'partial'
                                ? 'bg-secondary-container/40 border-secondary/30 text-on-secondary-container'
                                : refundStatus.state === 'none'
                                ? 'bg-surface-container border-outline-variant text-on-surface'
                                : 'bg-error-container/40 border-error/30 text-on-error-container'
                        }`}
                    >
                        <Icon
                            name={
                                refundStatus.state === 'failed'
                                    ? 'error'
                                    : refundStatus.state === 'none'
                                    ? 'info'
                                    : 'paid'
                            }
                            size={22}
                            className="mt-0.5 shrink-0"
                        />
                        <div className="flex-1">
                            {refundStatus.state === 'success' && (
                                <>
                                    <p className="font-semibold">Refund initiated</p>
                                    <p className="text-sm">
                                        ₹{Number(refundStatus.amount).toLocaleString()} ({refundStatus.percentage}%) will land in your account in {refundStatus.estimatedDays}.
                                    </p>
                                </>
                            )}
                            {refundStatus.state === 'partial' && (
                                <>
                                    <p className="font-semibold">Partial refund initiated</p>
                                    <p className="text-sm">
                                        ₹{Number(refundStatus.amount).toLocaleString()} ({refundStatus.percentage}%) per our cancellation policy. Arrives in {refundStatus.estimatedDays}.
                                    </p>
                                </>
                            )}
                            {refundStatus.state === 'none' && (
                                <>
                                    <p className="font-semibold">Booking cancelled — no refund</p>
                                    <p className="text-sm">{refundStatus.policy}</p>
                                </>
                            )}
                            {refundStatus.state === 'failed' && (
                                <>
                                    <p className="font-semibold">Refund couldn&apos;t be initiated automatically</p>
                                    <p className="text-sm">{refundStatus.message}</p>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => setRefundStatus(null)}
                            className="text-sm font-medium hover:opacity-70"
                            aria-label="Dismiss"
                        >
                            <Icon name="close" size={18} />
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                            <Icon name="chevron_right" size={16} />
                            <span className="text-on-surface">My Bookings</span>
                        </div>
                        <h1 className="font-display text-4xl md:text-5xl font-semibold text-on-surface tracking-tight mb-2">My bookings</h1>
                        <p className="text-on-surface-variant">Manage your upcoming matches and view past history.</p>
                    </div>
                    <Link href="/venues" className="btn btn-cta self-start md:self-auto">
                        <Icon name="add" size={16} />
                        Book new court
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-outline-variant mb-8 overflow-x-auto gap-2">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setActiveFilter(tab.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`tab ${activeFilter === tab.value ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setStatusFilter(tab.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                    statusFilter === tab.value
                                        ? 'bg-primary-container text-on-primary-container border-primary-container'
                                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchBookings}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                        <Icon name="refresh" size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-error-container border border-error/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <Icon name="error" size={20} className="text-error shrink-0" />
                        <p className="text-on-error-container flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="text-error hover:opacity-80">
                            <Icon name="close" size={20} />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-surface-container rounded-xl"></div>
                                    <div className="flex-1">
                                        <div className="h-5 w-1/3 bg-surface-container rounded mb-2"></div>
                                        <div className="h-4 w-1/2 bg-surface-container-low rounded mb-4"></div>
                                        <div className="h-4 w-2/3 bg-surface-container-low rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : bookings.length > 0 ? (
                    <>
                        {/* Booking List */}
                        <div className="flex flex-col gap-6">
                            {bookings.map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    variant="detailed"
                                    onCancel={openCancelModal}
                                    onDownload={handleDownloadReceipt}
                                    onReview={handleReviewBooking}
                                    showActions={true}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-8 bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                                <p className="text-sm text-on-surface-variant">
                                    Showing <span className="font-medium text-on-surface">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                                    <span className="font-medium text-on-surface">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                                    <span className="font-medium text-on-surface">{pagination.total}</span> bookings
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Icon name="chevron_left" size={20} />
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
                                                            ? 'bg-primary text-on-primary'
                                                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
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
                                        className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Icon name="chevron_right" size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="event_busy" size={40} className="text-on-surface-variant" />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-on-surface mb-2">Nothing here yet.</h3>
                        <p className="text-on-surface-variant mb-6">
                            {activeFilter === 'upcoming'
                                ? "You don't have any upcoming bookings"
                                : activeFilter === 'past'
                                ? "You don't have any past bookings"
                                : "You haven't made any bookings yet"
                            }
                        </p>
                        <Link href="/venues" className="btn btn-cta">
                            <Icon name="search" size={16} />
                            Find a Court
                        </Link>
                    </div>
                )}
            </div>

            {/* Cancel Booking Modal */}
            {showCancelModal && bookingToCancel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card anim-slide-up max-w-md w-full p-7">
                        <h3 className="font-display text-2xl font-semibold text-on-surface mb-2">Cancel this booking?</h3>
                        <p className="text-on-surface-variant mb-4">
                            <span className="text-on-surface font-semibold">{bookingToCancel.court?.name}</span> — this action cannot be undone.
                        </p>

                        <div className="p-4 bg-surface-container-low rounded-xl text-sm text-on-surface-variant mb-5 flex gap-3">
                            <Icon name="info" size={18} className="text-tertiary shrink-0 mt-0.5" />
                            <div>
                                Eligible refunds are credited back to your original payment method per our cancellation policy.
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                Reason (optional)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Anything we can do better?"
                                className="input resize-none"
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
                                className="btn btn-outline flex-1"
                            >
                                Keep booking
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={cancellingId === bookingToCancel.id}
                                className="btn flex-1 bg-error text-on-error disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancellingId === bookingToCancel.id ? (
                                    <>
                                        <Icon name="progress_activity" size={16} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, cancel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
