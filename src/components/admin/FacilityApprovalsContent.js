'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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

    const statusTabs = [
        { key: 'PENDING', label: 'Pending', count: stats?.pending || 0 },
        { key: 'APPROVED', label: 'Approved', count: stats?.approved || 0 },
        { key: 'REJECTED', label: 'Rejected', count: stats?.rejected || 0 }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-64 bg-surface-container rounded mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-96 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
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
                        <Icon name="error" className="text-on-error-container" size={32} />
                    </div>
                    <h2 className="font-display text-xl text-on-surface mb-2">Error Loading</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchApprovals}>
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="eyebrow mb-3">Admin Console</div>
                        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-on-surface">Facility approvals</h1>
                        <p className="text-base text-on-surface-variant mt-2">Review and moderate new venue submissions before they go live.</p>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex p-1 bg-surface-container rounded-xl w-fit">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilters(f => ({ ...f, status: tab.key, page: 1 }))}
                                className={`px-6 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                                    filters.status === tab.key
                                        ? 'bg-surface-container-lowest text-primary font-bold shadow-[var(--shadow-card)]'
                                        : 'text-on-surface-variant hover:text-on-surface font-medium'
                                }`}
                            >
                                {tab.label}
                                <span className={`font-mono px-2 py-0.5 rounded-full text-xs ${
                                    filters.status === tab.key ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" size={20} />
                        <input
                            type="text"
                            placeholder="Search by venue or owner name..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                            className="input"
                            style={{ paddingLeft: 40 }}
                        />
                    </div>
                    <button
                        onClick={fetchApprovals}
                        className="btn btn-outline btn-sm"
                    >
                        <Icon name="refresh" size={18} />
                        Refresh
                    </button>
                </div>

                {/* Venues Grid */}
                {venues.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                            <Icon name="domain" className="text-outline" size={32} />
                        </div>
                        <h3 className="font-display text-lg text-on-surface mb-2">No Venues Found</h3>
                        <p className="text-on-surface-variant">
                            {filters.status === 'PENDING'
                                ? 'No pending approvals at this time'
                                : `No ${filters.status.toLowerCase()} venues`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                        {venues.map((venue) => {
                            const isPending = venue.status === 'PENDING' || filters.status === 'PENDING';
                            const isApproved = venue.status === 'APPROVED';
                            const isRejected = venue.status === 'REJECTED';
                            const expanded = expandedVenue === venue.id;

                            return (
                                <article
                                    key={venue.id}
                                    className="card card-hover overflow-hidden flex flex-col"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 w-full bg-surface-variant">
                                        {venue.photos?.[0] ? (
                                            <Image
                                                src={venue.photos[0]}
                                                alt={venue.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 1024px) 100vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center photo-ph">
                                                <Icon name="domain" className="text-outline" size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className={`pill ${isApproved ? '' : isRejected ? 'error' : 'secondary'}`}>
                                                {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-display text-2xl text-on-surface leading-tight">{venue.name}</h3>
                                                <div className="flex items-center gap-1.5 text-on-surface-variant mt-1.5 text-sm">
                                                    <Icon name="location_on" size={18} />
                                                    <span>{venue.address}, {venue.city}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <span className="pill neutral" style={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0 }}>
                                                <Icon name="domain" size={14} />
                                                {venue.courtsCount || venue._count?.courts || 0} courts
                                            </span>
                                            {venue.amenities?.length > 0 && (
                                                <span className="pill neutral" style={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0 }}>
                                                    {venue.amenities.length} amenities
                                                </span>
                                            )}
                                            {isApproved && (
                                                <span className="pill" style={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0 }}>
                                                    <Icon name="check_circle" size={14} />
                                                    Verified
                                                </span>
                                            )}
                                        </div>

                                        {/* Owner Info */}
                                        <div className="mt-auto border-t border-outline-variant pt-4 mb-6">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                                                        {venue.owner?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-on-surface">{venue.owner?.name || 'Unknown Owner'}</p>
                                                        <p className="font-mono text-xs text-on-surface-variant">Submitted {formatDate(venue.createdAt || venue.submittedAt)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setExpandedVenue(expanded ? null : venue.id)}
                                                    className="text-primary text-sm font-medium hover:underline"
                                                >
                                                    {expanded ? 'Hide' : 'View'} Details
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {expanded && (
                                            <div className="mb-6 space-y-3 text-sm">
                                                {venue.description && (
                                                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant">
                                                        <p className="text-on-surface-variant">{venue.description}</p>
                                                    </div>
                                                )}
                                                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant space-y-2">
                                                    <p className="text-on-surface flex items-center gap-2">
                                                        <Icon name="mail" size={16} className="text-outline" />
                                                        {venue.owner?.email}
                                                    </p>
                                                    {venue.owner?.phone && (
                                                        <p className="text-on-surface flex items-center gap-2">
                                                            <Icon name="phone" size={16} className="text-outline" />
                                                            {venue.owner.phone}
                                                        </p>
                                                    )}
                                                </div>
                                                {venue.photos?.length > 1 && (
                                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                                        {venue.photos.slice(1).map((photo, i) => (
                                                            <div key={i} className="w-24 h-20 rounded-lg overflow-hidden shrink-0 relative bg-surface-variant">
                                                                <Image
                                                                    src={photo}
                                                                    alt={`${venue.name} photo ${i + 2}`}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="96px"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {isPending && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setActionModal({ ...venue, type: 'reject' })}
                                                    className="btn btn-outline"
                                                    style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                                                >
                                                    <Icon name="close" size={18} /> Reject
                                                </button>
                                                <button
                                                    onClick={() => setActionModal({ ...venue, type: 'approve' })}
                                                    className="btn btn-primary"
                                                >
                                                    <Icon name="check" size={18} /> Approve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            disabled={filters.page === 1}
                            className="btn btn-outline btn-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm font-mono text-on-surface-variant">
                            Page {filters.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            disabled={filters.page === pagination.totalPages}
                            className="btn btn-outline btn-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6 shadow-2xl anim-slide-up">
                        <h3 className={`font-display text-2xl mb-4 ${actionModal.type === 'approve' ? 'text-on-surface' : 'text-error'}`}>
                            {actionModal.type === 'approve' ? 'Approve Venue' : 'Reject Venue'}
                        </h3>
                        <p className="text-on-surface-variant mb-4">
                            {actionModal.type === 'approve'
                                ? `Are you sure you want to approve "${actionModal.name}"?`
                                : `Are you sure you want to reject "${actionModal.name}"?`
                            }
                        </p>

                        {actionModal.type === 'reject' && (
                            <div className="mb-4">
                                <label className="block font-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                                    Reason for rejection
                                </label>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    placeholder="Provide a reason..."
                                    rows={3}
                                    className="input"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionModal(null);
                                    setActionReason('');
                                }}
                                className="btn btn-outline flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(actionModal.type)}
                                disabled={processing}
                                className={`btn flex-1 disabled:opacity-50 ${actionModal.type === 'approve' ? 'btn-primary' : ''}`}
                                style={actionModal.type === 'approve' ? undefined : { background: 'var(--error)', color: 'var(--on-error)' }}
                            >
                                {processing && <Icon name="progress_activity" size={16} className="animate-spin" />}
                                {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
