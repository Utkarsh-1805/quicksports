'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
    Building2, 
    MapPin,
    Phone,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    User,
    ExternalLink,
    AlertCircle,
    RefreshCw,
    Search,
    Filter,
    Loader2,
    BadgeCheck,
    Star,
    Calendar,
    Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * FacilityApprovalsContent Component
 * Admin interface for approving/rejecting facility submissions
 */
export default function FacilityApprovalsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const [venues, setVenues] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [expandedVenue, setExpandedVenue] = useState(null);
    const [actionModal, setActionModal] = useState(null);
    const [actionReason, setActionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const [filters, setFilters] = useState({
        status: 'PENDING',
        search: '',
        page: 1
    });

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/admin/approvals');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchApprovals();
    }, [user, authLoading, filters]);

    const fetchApprovals = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const params = new URLSearchParams({
                status: filters.status,
                page: filters.page,
                limit: 10,
                ...(filters.search && { search: filters.search })
            });

            const res = await fetch(`/api/admin/approvals?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await res.json();

            if (result.success) {
                setVenues(result.data.venues || []);
                setStats(result.data.stats);
                setPagination(result.data.pagination);
            } else {
                throw new Error(result.message || 'Failed to load approvals');
            }
        } catch (err) {
            console.error('Fetch approvals error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        if (!actionModal) return;
        
        setProcessing(true);
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch('/api/admin/approvals', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    venueId: actionModal.id,
                    action: action,
                    adminNote: actionReason || `Venue ${action}d by admin`
                })
            });

            const result = await res.json();

            if (result.success) {
                // Refresh list
                fetchApprovals();
                setActionModal(null);
                setActionReason('');
            } else {
                throw new Error(result.message || 'Action failed');
            }
        } catch (err) {
            console.error('Action error:', err);
            alert(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white rounded-xl"></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-white rounded-xl"></div>
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
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchApprovals}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Facility Approvals</h1>
                        <p className="text-slate-500 mt-1">Review and manage venue submissions</p>
                    </div>
                    <button
                        onClick={fetchApprovals}
                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <button
                            onClick={() => setFilters(f => ({ ...f, status: 'PENDING', page: 1 }))}
                            className={`bg-white rounded-xl border p-4 text-left transition-all ${filters.status === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.pending || 0}</p>
                                    <p className="text-sm text-slate-500">Pending</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setFilters(f => ({ ...f, status: 'APPROVED', page: 1 }))}
                            className={`bg-white rounded-xl border p-4 text-left transition-all ${filters.status === 'APPROVED' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.approved || 0}</p>
                                    <p className="text-sm text-slate-500">Approved</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setFilters(f => ({ ...f, status: 'REJECTED', page: 1 }))}
                            className={`bg-white rounded-xl border p-4 text-left transition-all ${filters.status === 'REJECTED' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats.rejected || 0}</p>
                                    <p className="text-sm text-slate-500">Rejected</p>
                                </div>
                            </div>
                        </button>

                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white">
                            <p className="text-2xl font-bold">{(stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0)}</p>
                            <p className="text-sm text-slate-300">Total Submissions</p>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by venue or owner name..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>
                </div>

                {/* Venues List */}
                {venues.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Venues Found</h3>
                        <p className="text-slate-500">
                            {filters.status === 'PENDING' 
                                ? 'No pending approvals at this time'
                                : `No ${filters.status.toLowerCase()} venues`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {venues.map((venue) => (
                            <div key={venue.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                {/* Main Card */}
                                <div 
                                    className="p-6 cursor-pointer"
                                    onClick={() => setExpandedVenue(expandedVenue === venue.id ? null : venue.id)}
                                >
                                    <div className="flex gap-4">
                                        {/* Image */}
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                            {venue.photos?.[0] ? (
                                                <Image
                                                    src={venue.photos[0]}
                                                    alt={venue.name}
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Building2 className="w-8 h-8 text-slate-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 text-lg">{venue.name}</h3>
                                                    <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {venue.address}, {venue.city}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                                                    (venue.status || filters.status) === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                                                    venue.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                    {venue.status || filters.status}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {venue.owner?.name || 'Unknown Owner'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(venue.createdAt || venue.submittedAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-4 h-4" />
                                                    {venue.courtsCount || venue._count?.courts || 0} courts
                                                </span>
                                            </div>

                                            {/* Quick Action Buttons - Show for PENDING venues or when in pending filter */}
                                            {(venue.status === 'PENDING' || filters.status === 'PENDING') && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({ ...venue, type: 'approve' });
                                                        }}
                                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({ ...venue, type: 'reject' });
                                                        }}
                                                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expand Toggle */}
                                        <div className="hidden sm:flex items-center">
                                            {expandedVenue === venue.id ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedVenue === venue.id && (
                                    <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Owner Info */}
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    Owner Information
                                                </h4>
                                                <div className="bg-white rounded-xl p-4 space-y-2">
                                                    <p className="text-sm">
                                                        <span className="text-slate-500">Name:</span>{' '}
                                                        <span className="font-medium text-slate-900">{venue.owner?.name}</span>
                                                    </p>
                                                    <p className="text-sm flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        {venue.owner?.email}
                                                    </p>
                                                    <p className="text-sm flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        {venue.owner?.phone || 'Not provided'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Venue Details */}
                                            <div>
                                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                    <Info className="w-4 h-4" />
                                                    Venue Details
                                                </h4>
                                                <div className="bg-white rounded-xl p-4 space-y-2">
                                                    {venue.description && (
                                                        <p className="text-sm text-slate-600">{venue.description}</p>
                                                    )}
                                                    <p className="text-sm">
                                                        <span className="text-slate-500">Courts:</span>{' '}
                                                        <span className="font-medium">{venue.courtsCount || venue._count?.courts || 0}</span>
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="text-slate-500">Amenities:</span>{' '}
                                                        <span className="font-medium">{venue.amenities?.length || 0}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Photo Gallery */}
                                        {venue.photos?.length > 0 && (
                                            <div className="mt-6">
                                                <h4 className="font-semibold text-slate-900 mb-3">Photos</h4>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {venue.photos.map((photo, index) => (
                                                        <div key={index} className="w-32 h-24 rounded-lg overflow-hidden shrink-0">
                                                            <Image
                                                                src={photo}
                                                                alt={`${venue.name} photo ${index + 1}`}
                                                                width={128}
                                                                height={96}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {(venue.status === 'PENDING' || filters.status === 'PENDING') && (
                                            <div className="mt-6 flex gap-3">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActionModal({ ...venue, type: 'approve' });
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActionModal({ ...venue, type: 'reject' });
                                                    }}
                                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            disabled={filters.page === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-600">
                            Page {filters.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            disabled={filters.page === pagination.totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                            {actionModal.type === 'approve' ? 'Approve Venue' : 'Reject Venue'}
                        </h3>
                        <p className="text-slate-600 mb-4">
                            {actionModal.type === 'approve' 
                                ? `Are you sure you want to approve "${actionModal.name}"?`
                                : `Are you sure you want to reject "${actionModal.name}"?`
                            }
                        </p>
                        
                        {actionModal.type === 'reject' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Reason for rejection
                                </label>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder="Provide a reason..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionModal(null);
                                    setActionReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <Button
                                onClick={() => handleAction(actionModal.type)}
                                disabled={processing}
                                className={actionModal.type === 'approve' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1 bg-red-600 hover:bg-red-700'}
                            >
                                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
