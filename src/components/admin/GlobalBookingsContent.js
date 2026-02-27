'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Calendar,
    Search,
    User,
    Building2,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Download,
    Filter,
    DollarSign,
    MapPin,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

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
                return { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle };
            case 'PENDING':
                return { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock };
            case 'CANCELLED':
                return { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle };
            case 'COMPLETED':
                return { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-700', icon: Calendar };
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-white rounded-xl"></div>
                            ))}
                        </div>
                        <div className="h-16 bg-white rounded-xl mb-4"></div>
                        <div className="space-y-2">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-16 bg-white rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Bookings</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchBookings}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">All Bookings</h1>
                        <p className="text-slate-500 mt-1">Monitor platform-wide booking activity</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">
                            {pagination?.total || 0} total bookings
                        </span>
                        <button
                            onClick={fetchBookings}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.confirmed || 0}</p>
                                    <p className="text-sm text-slate-500">Confirmed</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.pending || 0}</p>
                                    <p className="text-sm text-slate-500">Pending</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.cancelled || 0}</p>
                                    <p className="text-sm text-slate-500">Cancelled</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white">
                            <DollarSign className="w-5 h-5 mb-1 opacity-80" />
                            <p className="text-2xl font-bold">₹{(summary.totalRevenue || 0).toLocaleString()}</p>
                            <p className="text-sm text-white/80">Total Revenue</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by booking ID, user, or venue..."
                                value={filters.search}
                                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>

                        {/* Status */}
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        {/* Date From */}
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />

                        {/* Date To */}
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value, page: 1 }))}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />

                        {/* Sort */}
                        <select
                            value={`${filters.sort}-${filters.order}`}
                            onChange={(e) => {
                                const [sort, order] = e.target.value.split('-');
                                setFilters(f => ({ ...f, sort, order, page: 1 }));
                            }}
                            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="bookingDate-desc">Date (Latest)</option>
                            <option value="bookingDate-asc">Date (Earliest)</option>
                            <option value="totalAmount-desc">Amount (High to Low)</option>
                            <option value="totalAmount-asc">Amount (Low to High)</option>
                        </select>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Booking</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">User</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Venue / Court</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Date & Time</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Amount</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600 text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking) => {
                                    const statusStyle = getStatusBadge(booking.status);
                                    const StatusIcon = statusStyle.icon;
                                    
                                    return (
                                        <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                            <td className="py-4 px-6">
                                                <p className="font-mono text-sm text-slate-900">#{booking.id.slice(0, 8)}</p>
                                                <p className="text-xs text-slate-400">{formatDate(booking.createdAt)}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                                        {booking.user?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 text-sm">{booking.user?.name}</p>
                                                        <p className="text-xs text-slate-500">{booking.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-medium text-slate-900 text-sm">{booking.timeslot?.court?.facility?.name}</p>
                                                <p className="text-xs text-slate-500">{booking.timeslot?.court?.name}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-medium text-slate-900 text-sm">{formatDate(booking.bookingDate)}</p>
                                                <p className="text-xs text-slate-500">
                                                    {formatTime(booking.timeslot?.startTime)} - {formatTime(booking.timeslot?.endTime)}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-semibold text-slate-900">₹{booking.totalAmount?.toLocaleString()}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List */}
                    <div className="lg:hidden divide-y divide-slate-100">
                        {bookings.map((booking) => {
                            const statusStyle = getStatusBadge(booking.status);
                            const StatusIcon = statusStyle.icon;
                            
                            return (
                                <div key={booking.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="font-mono text-sm text-slate-900">#{booking.id.slice(0, 8)}</p>
                                            <p className="text-sm font-medium text-slate-900 mt-1">
                                                {booking.timeslot?.court?.facility?.name}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {booking.user?.name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(booking.bookingDate)}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-slate-900">₹{booking.totalAmount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {bookings.length === 0 && (
                        <div className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-semibold text-slate-900 mb-2">No Bookings Found</h3>
                            <p className="text-slate-500">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            disabled={filters.page === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            Page {filters.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            disabled={filters.page === pagination.totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
