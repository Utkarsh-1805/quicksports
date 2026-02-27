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
                return { color: 'bg-green-50 text-green-700 border-green-200', label: 'Confirmed' };
            case 'PENDING':
                return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' };
            case 'CANCELLED':
                return { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' };
            case 'COMPLETED':
                return { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Completed' };
            default:
                return { color: 'bg-slate-50 text-slate-700 border-slate-200', label: status };
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

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch = 
            booking.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.courtName?.toLowerCase().includes(searchQuery.toLowerCase());
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
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-20 bg-white rounded-xl border border-slate-200"></div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="h-12 w-full bg-slate-200 rounded mb-4"></div>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-16 w-full bg-slate-100 rounded mb-2"></div>
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
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Bookings</h1>
                        <p className="text-slate-500 mt-1">Manage all bookings across your facilities</p>
                    </div>
                    <button
                        onClick={fetchBookings}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-green-600">Confirmed</p>
                        <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-yellow-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-blue-600">Completed</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-sm text-red-600">Cancelled</p>
                        <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by customer or court name..."
                                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {paginatedBookings.length > 0 ? (
                        <>
                            {/* Table Header */}
                            <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                                <div>Customer</div>
                                <div>Court</div>
                                <div>Date & Time</div>
                                <div>Amount</div>
                                <div>Status</div>
                                <div className="text-right">Actions</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-slate-100">
                                {paginatedBookings.map((booking) => {
                                    const statusConfig = getStatusConfig(booking.status);
                                    
                                    return (
                                        <div
                                            key={booking.id}
                                            className="p-4 hover:bg-slate-50 transition-colors"
                                        >
                                            {/* Mobile View */}
                                            <div className="md:hidden space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {booking.userName?.charAt(0).toUpperCase() || 'G'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{booking.userName}</p>
                                                            <p className="text-sm text-slate-500">{booking.courtName}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(booking.createdAt)}</span>
                                                    </div>
                                                    <p className="font-semibold text-purple-600">₹{(booking.amount || 0).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Desktop View */}
                                            <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                        {booking.userName?.charAt(0).toUpperCase() || 'G'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">{booking.userName}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-lg">{getSportIcon(booking.sportType)}</span>
                                                    <p className="text-slate-700 truncate">{booking.courtName}</p>
                                                </div>
                                                
                                                <div className="text-sm text-slate-600">
                                                    <p>{formatDate(booking.createdAt)}</p>
                                                    {booking.startTime && (
                                                        <p className="text-slate-400">{formatTime(booking.startTime)}</p>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <p className="font-semibold text-slate-900">₹{(booking.amount || 0).toLocaleString()}</p>
                                                </div>
                                                
                                                <div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <Link
                                                        href={`/booking/confirmation/${booking.id}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between p-4 border-t border-slate-200">
                                    <p className="text-sm text-slate-500">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                                                const page = idx + 1;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-purple-600 text-white'
                                                                : 'hover:bg-slate-100'
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
                                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-medium text-slate-900 mb-1">No Bookings Found</h3>
                            <p className="text-sm text-slate-500">
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
