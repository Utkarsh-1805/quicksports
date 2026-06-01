'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * FacilitiesContent Component
 * Lists all facilities owned by the current user
 */
export default function FacilitiesContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeMenu, setActiveMenu] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/owner/facilities');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchFacilities();
    }, [user, authLoading]);

    const fetchFacilities = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view facilities');
            }

            // Use owner dashboard endpoint to get facilities
            const res = await fetch('/api/owner/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setFacilities(data.data.venues || []);
            } else {
                throw new Error(data.message || 'Failed to load facilities');
            }
        } catch (err) {
            console.error('Fetch facilities error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!facilityToDelete) return;

        setDeletingId(facilityToDelete.id);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/venues/${facilityToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setFacilities(prev => prev.filter(f => f.id !== facilityToDelete.id));
                setShowDeleteModal(false);
                setFacilityToDelete(null);
            } else {
                throw new Error(data.message || 'Failed to delete facility');
            }
        } catch (err) {
            console.error('Delete facility error:', err);
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'APPROVED':
                return {
                    icon: CheckCircle,
                    iconName: 'check_circle',
                    pillClass: 'bg-primary-container/20 text-primary border-primary/30',
                    dotClass: 'bg-primary',
                    label: 'Approved'
                };
            case 'PENDING':
                return {
                    icon: Clock,
                    iconName: 'schedule',
                    pillClass: 'bg-secondary-container/20 text-secondary-container border-secondary-container/30',
                    dotClass: 'bg-secondary-container',
                    label: 'Pending'
                };
            case 'REJECTED':
                return {
                    icon: XCircle,
                    iconName: 'cancel',
                    pillClass: 'bg-error-container text-on-error-container border-error/30',
                    dotClass: 'bg-error',
                    label: 'Needs Revision'
                };
            default:
                return {
                    icon: Building2,
                    iconName: 'stadium',
                    pillClass: 'bg-surface-container text-on-surface-variant border-outline-variant',
                    dotClass: 'bg-outline',
                    label: status
                };
        }
    };

    // Filter facilities
    const filteredFacilities = facilities.filter(facility => {
        const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            facility.city?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || facility.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        all: facilities.length,
        APPROVED: facilities.filter(f => f.status === 'APPROVED').length,
        PENDING: facilities.filter(f => f.status === 'PENDING').length,
        REJECTED: facilities.filter(f => f.status === 'REJECTED').length
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-10 w-64 bg-surface-container rounded animate-pulse"></div>
                        <div className="h-10 w-36 bg-surface-container rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30">
                                <div className="h-40 bg-surface-container rounded-xl mb-4 animate-pulse"></div>
                                <div className="h-5 w-32 bg-surface-container rounded animate-pulse mb-2"></div>
                                <div className="h-4 w-24 bg-surface-container-low rounded animate-pulse"></div>
                            </div>
                        ))}
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
                        <Icon name="error" className="text-error" size={32} />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">Error Loading Facilities</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchFacilities}>
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <p className="eyebrow mb-2">My Facilities</p>
                        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface mb-2 tracking-tight">My Facilities</h1>
                        <p className="text-on-surface-variant max-w-2xl">
                            Manage your venues, view status, and track monthly booking volume. Keep your athletic spaces running at peak performance.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search facilities..."
                                className="input pl-10 w-full md:w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Status Tabs (segmented control) */}
                <div className="bg-surface-container rounded-xl p-1 inline-flex gap-1 mb-8 overflow-x-auto">
                    {[
                        { value: 'all', label: 'All' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'REJECTED', label: 'Needs Revision' }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                statusFilter === tab.value
                                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-mono ${
                                statusFilter === tab.value
                                    ? 'bg-surface-container text-on-surface-variant'
                                    : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                                {statusCounts[tab.value]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Facilities Grid */}
                {filteredFacilities.length > 0 || (!searchQuery && statusFilter === 'all') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Add Facility Card */}
                        {!searchQuery && statusFilter === 'all' && (
                            <Link
                                href="/owner/facilities/new"
                                className="group flex flex-col items-center justify-center min-h-[420px] bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl hover:border-primary hover:bg-surface-container transition-all duration-300"
                            >
                                <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Icon name="add_circle" size={32} className="text-primary" />
                                </div>
                                <span className="text-xl font-semibold text-on-surface group-hover:text-primary transition-colors">Add Facility</span>
                                <span className="text-sm text-on-surface-variant mt-2">Register a new sports complex</span>
                            </Link>
                        )}

                        {filteredFacilities.map((facility) => {
                            const statusConfig = getStatusConfig(facility.status);

                            return (
                                <div
                                    key={facility.id}
                                    className="card card-hover overflow-hidden flex flex-col group"
                                >
                                    {/* Image / Cover */}
                                    <div className="relative h-48 bg-surface-variant overflow-hidden">
                                        {facility.coverImage ? (
                                            <img
                                                src={facility.coverImage}
                                                alt={facility.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-container/20 to-secondary-container/10 flex items-center justify-center">
                                                <Icon name="stadium" size={64} className="text-primary/40" />
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className={`absolute top-4 right-4 backdrop-blur-sm bg-surface/90 px-3 py-1.5 rounded-full flex items-center gap-1.5 border shadow-sm ${statusConfig.pillClass}`}>
                                            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass} ${facility.status === 'APPROVED' ? 'animate-pulse' : ''}`}></span>
                                            <span className="font-mono text-xs font-medium">{statusConfig.label}</span>
                                        </div>

                                        {/* Actions Menu */}
                                        <div className="absolute top-4 left-4">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === facility.id ? null : facility.id)}
                                                className="p-2 bg-surface/90 backdrop-blur-sm rounded-lg hover:bg-surface transition-colors"
                                                aria-label="More actions"
                                            >
                                                <Icon name="more_vert" size={18} className="text-on-surface-variant" />
                                            </button>

                                            {activeMenu === facility.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <div className="absolute left-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 py-1 z-20">
                                                        <Link
                                                            href={`/owner/facilities/${facility.id}`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container"
                                                        >
                                                            <Icon name="visibility" size={16} />
                                                            View Details
                                                        </Link>
                                                        <Link
                                                            href={`/owner/facilities/${facility.id}`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container"
                                                        >
                                                            <Icon name="edit" size={16} />
                                                            Edit Facility
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setFacilityToDelete(facility);
                                                                setShowDeleteModal(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-container w-full"
                                                        >
                                                            <Icon name="delete" size={16} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="font-display text-xl font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                                                {facility.name}
                                            </h3>
                                            <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                                                <Icon name="location_on" size={16} />
                                                {facility.city || 'Location not set'}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        {facility.status !== 'REJECTED' ? (
                                            <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                                                <div className="bg-surface-container-low p-3 rounded-xl">
                                                    <span className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.08em] mb-1">Total Courts</span>
                                                    <span className="font-mono text-on-surface text-base font-semibold">{facility.totalCourts || 0}</span>
                                                </div>
                                                <div className="bg-surface-container-low p-3 rounded-xl">
                                                    <span className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.08em] mb-1">Bookings</span>
                                                    <span className="font-mono text-on-surface text-base font-semibold">{facility.totalBookings || 0}</span>
                                                </div>
                                                <div className="bg-surface-container-low p-3 rounded-xl">
                                                    <span className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.08em] mb-1">Rating</span>
                                                    <span className="font-mono text-on-surface text-base font-semibold flex items-center gap-1">
                                                        <Icon name="star" filled size={14} className="text-secondary-container" />
                                                        {facility.rating || '-'}
                                                    </span>
                                                </div>
                                                <div className="bg-surface-container-low p-3 rounded-xl">
                                                    <span className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.08em] mb-1">Revenue</span>
                                                    <span className="font-mono text-primary text-base font-semibold">
                                                        ₹{((facility.totalEarnings || 0) / 1000).toFixed(1)}k
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-error-container/40 rounded-xl mb-4 mt-auto">
                                                <p className="text-sm text-on-error-container flex items-start gap-2">
                                                    <Icon name="info" size={16} className="mt-0.5" />
                                                    {facility.rejectionReason || 'This facility needs updates before it can be approved.'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-4 border-t border-outline-variant/40">
                                            <Link
                                                href={`/owner/facilities/${facility.id}/edit`}
                                                className="btn btn-outline btn-sm flex-1"
                                            >
                                                <Icon name="edit" size={16} />
                                                {facility.status === 'REJECTED' ? 'Fix Issues' : 'Edit'}
                                            </Link>
                                            {facility.status !== 'REJECTED' && (
                                                <Link
                                                    href={`/owner/facilities/${facility.id}`}
                                                    className="btn btn-primary btn-sm flex-1"
                                                >
                                                    <Icon name="visibility" size={16} />
                                                    View
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mx-auto mb-4">
                            <Icon name="stadium" size={40} className="text-primary/60" />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
                            {searchQuery || statusFilter !== 'all' ? 'No Facilities Found' : 'No Facilities Yet'}
                        </h3>
                        <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
                            {searchQuery || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                : 'Create your first facility to start accepting bookings from customers.'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <Link href="/owner/facilities/new">
                                <button className="btn btn-cta">
                                    <Icon name="add" size={18} />
                                    Add Your First Facility
                                </button>
                            </Link>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="card p-6 max-w-md w-full anim-slide-up">
                            <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                                <Icon name="delete" size={28} className="text-error" />
                            </div>
                            <h3 className="font-display text-xl font-semibold text-on-surface text-center mb-2">
                                Delete Facility?
                            </h3>
                            <p className="text-on-surface-variant text-center mb-6">
                                Are you sure you want to delete <strong className="text-on-surface">{facilityToDelete?.name}</strong>?
                                This action cannot be undone and will remove all associated courts and bookings.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setFacilityToDelete(null);
                                    }}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deletingId === facilityToDelete?.id}
                                    className="btn flex-1 bg-error text-on-error hover:opacity-90 disabled:opacity-50"
                                >
                                    {deletingId === facilityToDelete?.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
