'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * GlobalBookingsContent Component
 * Admin interface for viewing all platform bookings
 */
export default function GlobalBookingsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [expandedBooking, setExpandedBooking] = useState(null);

    const [filters, setFilters] = useState({
        status: '',
        search: '',
        dateFrom: '',
        dateTo: '',
        sort: 'createdAt',
        order: 'desc',
        page: 1
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/admin/bookings');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchBookings();
    }, [user, authLoading, filters]);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const params = new URLSearchParams({
                page: filters.page,
                limit: 15,
                sortBy: filters.sort,
                order: filters.order,
                ...(filters.status && { status: filters.status }),
                ...(filters.search && { search: filters.search }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo })
            });

            const res = await fetch(`/api/admin/bookings?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await res.json();

            if (result.success) {
                setBookings(result.data.bookings || []);
                // Transform summary from byStatus array to flat structure
                const apiSummary = result.data.summary || {};
                const byStatusMap = (apiSummary.byStatus || []).reduce((acc, item) => {
                    acc[item.status.toLowerCase()] = { count: item.count, revenue: item.revenue };
                    return acc;
                }, {});
                setSummary({
                    total: apiSummary.total || 0,
                    confirmed: byStatusMap.confirmed?.count || 0,
                    pending: byStatusMap.pending?.count || 0,
                    cancelled: byStatusMap.cancelled?.count || 0,
                    completed: byStatusMap.completed?.count || 0,
                    totalRevenue: (byStatusMap.confirmed?.revenue || 0) + (byStatusMap.completed?.revenue || 0)
                });
                setPagination(result.data.pagination);
            } else {
                throw new Error(result.message || 'Failed to load bookings');
            }
        } catch (err) {
            console.error('Fetch bookings error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return { pill: 'bg-primary-container text-on-primary-container', dot: 'bg-primary animate-pulse', label: 'Live Active' };
            case 'PENDING':
                return { pill: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary', label: 'Upcoming' };
            case 'CANCELLED':
                return { pill: 'bg-error-container text-on-error-container', dot: 'bg-error', label: 'Cancelled' };
            case 'COMPLETED':
                return { pill: 'bg-surface-variant text-on-surface-variant', dot: 'bg-outline', label: 'Completed' };
            default:
                return { pill: 'bg-surface-container-highest text-on-surface-variant', dot: 'bg-outline', label: status };
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-12 w-64 bg-surface-container rounded mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="error" className="text-on-error-container" size={32} />
                    </div>
                    <h2 className="font-display text-xl text-on-surface mb-2">Error Loading Bookings</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchBookings}>
                        <Icon name="refresh" size={16} className="mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-8 border-b border-outline-variant">
                    <div>
                        <div className="eyebrow mb-3">Admin Console</div>
                        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-on-surface">Global bookings</h1>
                        <p className="text-base text-on-surface-variant mt-2 max-w-2xl">
                            Monitor global platform activity, manage venue reservations, and resolve transactional disputes in real-time.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-on-surface-variant">
                            {pagination?.total || 0} entries
                        </span>
                        <button
                            onClick={fetchBookings}
                            className="btn btn-outline btn-sm"
                        >
                            <Icon name="refresh" size={18} />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* Quick Metrics Bento Grid */}
                {summary && (
                    <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                        <div className="card card-hover p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-on-surface-variant">Live / Confirmed</span>
                                <Icon name="sensors" className="text-primary" />
                            </div>
                            <div className="font-display text-4xl text-on-surface">{summary.confirmed || 0}</div>
                            <div className="mt-2 text-xs font-mono text-primary flex items-center gap-1">
                                <Icon name="arrow_upward" size={14} /> Active reservations
                            </div>
                        </div>

                        <div className="card card-hover p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-on-surface-variant">Upcoming / Pending</span>
                                <Icon name="confirmation_number" className="text-tertiary" />
                            </div>
                            <div className="font-display text-4xl text-on-surface">{summary.pending || 0}</div>
                            <div className="mt-2 text-xs font-mono text-on-surface-variant">Awaiting confirmation</div>
                        </div>

                        <div className="card card-hover p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-on-surface-variant">Cancelled</span>
                                <Icon name="gavel" className="text-error" />
                            </div>
                            <div className="font-display text-4xl text-on-surface">{summary.cancelled || 0}</div>
                            <div className="mt-2 text-xs font-mono text-error flex items-center gap-1">
                                <Icon name="warning" size={14} /> Refund eligible
                            </div>
                        </div>

                        <div className="card card-hover p-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-transparent z-0"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-on-surface-variant">Gross Value</span>
                                    <Icon name="payments" className="text-primary" />
                                </div>
                                <div className="font-display font-mono text-4xl text-on-surface tracking-tight">
                                    ₹{(summary.totalRevenue || 0).toLocaleString()}
                                </div>
                                <div className="mt-2 text-xs font-mono text-on-surface-variant">From confirmed + completed</div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Data Table Section */}
                <section className="card overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" size={20} />
                            <input
                                type="text"
                                placeholder="Search ID, User, or Venue..."
                                value={filters.search}
                                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                                className="input"
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                                className="input cursor-pointer"
                                style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
                            >
                                <option value="">Any Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>

                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value, page: 1 }))}
                                className="input font-mono"
                                style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
                            />

                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value, page: 1 }))}
                                className="input font-mono"
                                style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
                            />

                            <select
                                value={`${filters.sort}-${filters.order}`}
                                onChange={(e) => {
                                    const [sort, order] = e.target.value.split('-');
                                    setFilters(f => ({ ...f, sort, order, page: 1 }));
                                }}
                                className="input cursor-pointer"
                                style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
                            >
                                <option value="createdAt-desc">Newest First</option>
                                <option value="createdAt-asc">Oldest First</option>
                                <option value="bookingDate-desc">Date (Latest)</option>
                                <option value="bookingDate-asc">Date (Earliest)</option>
                                <option value="totalAmount-desc">Amount (High)</option>
                                <option value="totalAmount-asc">Amount (Low)</option>
                            </select>
                            <button
                                className="btn btn-outline btn-sm"
                                title="More Filters"
                            >
                                <Icon name="filter_list" />
                            </button>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-4 font-mono border-b border-outline-variant w-24">Ref ID</th>
                                    <th className="p-4 font-mono border-b border-outline-variant">Venue &amp; Court</th>
                                    <th className="p-4 font-mono border-b border-outline-variant">User Details</th>
                                    <th className="p-4 font-mono border-b border-outline-variant">Schedule</th>
                                    <th className="p-4 font-mono border-b border-outline-variant text-right">Amount</th>
                                    <th className="p-4 font-mono border-b border-outline-variant">Status</th>
                                    <th className="p-4 font-mono border-b border-outline-variant text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant text-on-surface">
                                {bookings.map((booking) => {
                                    const statusStyle = getStatusBadge(booking.status);
                                    const isDisputed = booking.status === 'CANCELLED';

                                    return (
                                        <tr
                                            key={booking.id}
                                            className={`hover:bg-surface-container-low transition-colors group ${isDisputed ? 'bg-error-container/10' : ''}`}
                                        >
                                            <td className="p-4 font-mono text-sm text-on-surface-variant">#{booking.id.slice(0, 8)}</td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium">{booking.timeslot?.court?.facility?.name}</div>
                                                <div className="text-sm text-on-surface-variant">{booking.timeslot?.court?.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium">{booking.user?.name}</div>
                                                <div className="text-sm text-on-surface-variant">{booking.user?.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-sm">{formatDate(booking.bookingDate)}</div>
                                                <div className={`font-mono text-sm ${isDisputed ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                                                    {formatTime(booking.timeslot?.startTime)} - {formatTime(booking.timeslot?.endTime)}
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-sm text-right">₹{booking.totalAmount?.toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-medium ${statusStyle.pill}`}>
                                                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-error-container transition-colors"
                                                        title="Flag Dispute"
                                                    >
                                                        <Icon name="flag" size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                                                        className="p-1.5 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container-high transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Icon name="visibility" size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List */}
                    <div className="lg:hidden divide-y divide-outline-variant">
                        {bookings.map((booking) => {
                            const statusStyle = getStatusBadge(booking.status);
                            return (
                                <div key={booking.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="font-mono text-sm text-on-surface-variant">#{booking.id.slice(0, 8)}</p>
                                            <p className="text-sm font-medium text-on-surface mt-1">
                                                {booking.timeslot?.court?.facility?.name}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-medium ${statusStyle.pill}`}>
                                            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3 text-on-surface-variant">
                                            <span className="flex items-center gap-1">
                                                <Icon name="person" size={14} />
                                                {booking.user?.name}
                                            </span>
                                            <span className="flex items-center gap-1 font-mono">
                                                <Icon name="event" size={14} />
                                                {formatDate(booking.bookingDate)}
                                            </span>
                                        </div>
                                        <p className="font-mono font-semibold text-on-surface">₹{booking.totalAmount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {bookings.length === 0 && (
                        <div className="p-12 text-center">
                            <Icon name="event_busy" className="text-outline mx-auto mb-4" size={48} />
                            <h3 className="font-display text-on-surface mb-2">No Bookings Found</h3>
                            <p className="text-on-surface-variant">Try adjusting your search or filters</p>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between text-sm text-on-surface-variant">
                            <div>Showing page {filters.page} of {pagination.totalPages} ({pagination.total} entries)</div>
                            <div className="flex gap-1 items-center">
                                <button
                                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                    disabled={filters.page === 1}
                                    className="btn btn-outline btn-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="font-mono px-3 py-1 bg-primary-container text-on-primary-container rounded-lg font-medium">
                                    {filters.page}
                                </span>
                                <button
                                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                    disabled={filters.page === pagination.totalPages}
                                    className="btn btn-outline btn-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
