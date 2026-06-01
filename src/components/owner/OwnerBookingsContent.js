'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Calendar,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Clock,
    User,
    MapPin,
    DollarSign,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    RefreshCw,
    Download,
    Eye,
    MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * OwnerBookingsContent Component
 * Shows all bookings across owner's facilities
 */
export default function OwnerBookingsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [venueFilter, setVenueFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [venues, setVenues] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/owner/bookings');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchBookings();
    }, [user, authLoading]);

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

            // Fetch dashboard data which includes recent activity (bookings)
            const res = await fetch('/api/owner/dashboard?period=year', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                // Transform recentActivity to bookings format
                const allBookings = data.data.recentActivity || [];
                setBookings(allBookings);
                setVenues(data.data.venues || []);
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

    const getStatusConfig = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return { pill: 'pill', dot: 'bg-current', label: 'Confirmed' };
            case 'PENDING':
                return { pill: 'pill secondary', dot: 'bg-current', label: 'Pending' };
            case 'CANCELLED':
                return { pill: 'pill error', dot: 'bg-current', label: 'Cancelled' };
            case 'COMPLETED':
                return { pill: 'pill tertiary', dot: 'bg-current', label: 'Completed' };
            default:
                return { pill: 'pill neutral', dot: 'bg-current', label: status };
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
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

    const getInitials = (name) => {
        if (!name) return 'G';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.courtName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.id?.toString().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Paginate
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Summary stats
    const stats = {
        total: bookings.length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-48 bg-surface-container rounded mb-6"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-24 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
                        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6">
                            <div className="h-12 w-full bg-surface-container rounded mb-4"></div>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-16 w-full bg-surface-container/50 rounded mb-2"></div>
                            ))}
                        </div>
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
                        <Icon name="error" size={32} className="text-error" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">Error Loading Bookings</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <button
                        onClick={fetchBookings}
                        className="btn btn-cta"
                    >
                        <Icon name="refresh" size={18} />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <p className="eyebrow mb-2">Bookings</p>
                        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">Bookings</h1>
                        <p className="text-on-surface-variant mt-2">Manage all bookings across your facilities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchBookings}
                            className="btn btn-outline btn-sm"
                        >
                            <Icon name="refresh" size={18} />
                            Refresh
                        </button>
                        <button className="btn btn-outline btn-sm">
                            <Icon name="download" size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                    <div className="card p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant font-mono mb-2">Total</p>
                        <p className="font-display font-mono text-3xl font-semibold text-on-surface">{stats.total}</p>
                    </div>
                    <div className="card p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-primary font-mono mb-2 font-semibold">Confirmed</p>
                        <p className="font-display font-mono text-3xl font-semibold text-on-surface">{stats.confirmed}</p>
                    </div>
                    <div className="card p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-on-secondary-container font-mono mb-2 font-semibold">Pending</p>
                        <p className="font-display font-mono text-3xl font-semibold text-on-surface">{stats.pending}</p>
                    </div>
                    <div className="card p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-tertiary font-mono mb-2 font-semibold">Completed</p>
                        <p className="font-display font-mono text-3xl font-semibold text-on-surface">{stats.completed}</p>
                    </div>
                    <div className="card p-5">
                        <p className="text-[11px] uppercase tracking-[0.08em] text-error font-mono mb-2 font-semibold">Cancelled</p>
                        <p className="font-display font-mono text-3xl font-semibold text-on-surface">{stats.cancelled}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
                                <Icon name="search" size={20} />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by ID, customer or court name..."
                                className="input pl-12"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="input appearance-none pr-10 w-auto"
                            >
                                <option value="all">All Statuses</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="PENDING">Pending</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" aria-hidden="true">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="card overflow-hidden">
                    {paginatedBookings.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono">Booking ID</th>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono">User</th>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono">Court / Facility</th>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono">Date &amp; Time</th>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono text-right">Amount</th>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono">Status</th>
                                            <th className="py-3 px-6 text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/50">
                                        {paginatedBookings.map((booking) => {
                                            const statusConfig = getStatusConfig(booking.status);

                                            return (
                                                <tr
                                                    key={booking.id}
                                                    className="hover:bg-surface-container-low transition-colors group"
                                                >
                                                    <td className="py-4 px-6 font-mono text-sm text-on-surface-variant">#BK-{String(booking.id).slice(-6)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar w-9 h-9 bg-primary-container text-on-primary-container shrink-0">
                                                                {getInitials(booking.userName)}
                                                            </div>
                                                            <span className="text-on-surface font-medium">{booking.userName || 'Guest'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{getSportIcon(booking.sportType)}</span>
                                                            <div>
                                                                <p className="text-on-surface">{booking.courtName}</p>
                                                                {booking.venueName && (
                                                                    <p className="text-sm text-on-surface-variant">{booking.venueName}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-on-surface">{formatDate(booking.createdAt)}</p>
                                                        {booking.startTime && (
                                                            <p className="font-mono text-sm text-on-surface-variant">{formatTime(booking.startTime)}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-on-surface text-right font-semibold">₹{(booking.amount || 0).toLocaleString()}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={statusConfig.pill}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} opacity-70`}></span>
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <Link
                                                            href={`/booking/confirmation/${booking.id}`}
                                                            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant group-hover:text-primary hover:bg-surface-container-high transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Icon name="visibility" size={20} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-outline-variant/50">
                                {paginatedBookings.map((booking) => {
                                    const statusConfig = getStatusConfig(booking.status);

                                    return (
                                        <div key={booking.id} className="p-4 hover:bg-surface-container-low transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar w-10 h-10 bg-primary-container text-on-primary-container">
                                                        {getInitials(booking.userName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-on-surface">{booking.userName || 'Guest'}</p>
                                                        <p className="text-sm text-on-surface-variant">{booking.courtName}</p>
                                                    </div>
                                                </div>
                                                <span className={statusConfig.pill}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} opacity-70`}></span>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-on-surface-variant">
                                                    <Icon name="calendar_today" size={16} />
                                                    <span>{formatDate(booking.createdAt)}</span>
                                                </div>
                                                <p className="font-mono font-bold text-on-surface">₹{(booking.amount || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
                                    <p className="text-sm text-on-surface-variant font-mono">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} entries
                                    </p>
                                    <div className="flex gap-1 items-center">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Prev
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                                const page = idx + 1;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold font-mono transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-primary text-on-primary'
                                                                : 'border border-outline-variant text-on-surface hover:bg-surface-container-high'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                                <Icon name="calendar_today" size={36} className="text-outline" />
                            </div>
                            <h3 className="font-display font-semibold text-on-surface mb-1">No Bookings Found</h3>
                            <p className="text-sm text-on-surface-variant">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters'
                                    : 'Bookings will appear here once customers start booking your courts.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
