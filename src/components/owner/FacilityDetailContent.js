'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import FacilityPhotosManager from '@/components/owner/FacilityPhotosManager';
import BlockSlotsManager from '@/components/owner/BlockSlotsManager';

/**
 * FacilityDetailContent Component
 * Shows facility details and courts management
 */
export default function FacilityDetailContent() {
    const router = useRouter();
    const params = useParams();
    const facilityId = params?.id;
    const { user, loading: authLoading } = useAuth();

    const [facility, setFacility] = useState(null);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('courts');
    const [showAddCourtModal, setShowAddCourtModal] = useState(false);
    const [editingCourt, setEditingCourt] = useState(null);
    const [deletingCourtId, setDeletingCourtId] = useState(null);
    const [courtForm, setCourtForm] = useState({
        name: '',
        sportType: 'BADMINTON',
        pricePerHour: '',
        description: ''
    });
    const [savingCourt, setSavingCourt] = useState(false);

    const sportTypes = [
        { value: 'BADMINTON', label: 'Badminton', icon: '🏸' },
        { value: 'TENNIS', label: 'Tennis', icon: '🎾' },
        { value: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
        { value: 'FOOTBALL', label: 'Football', icon: '⚽' },
        { value: 'CRICKET', label: 'Cricket', icon: '🏏' },
        { value: 'TABLE_TENNIS', label: 'Table Tennis', icon: '🏓' },
        { value: 'VOLLEYBALL', label: 'Volleyball', icon: '🏐' },
        { value: 'SWIMMING', label: 'Swimming', icon: '🏊' }
    ];

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

        if (facilityId) {
            fetchFacilityDetails();
        }
    }, [user, authLoading, facilityId]);

    const fetchFacilityDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view facility');
            }

            const res = await fetch(`/api/venues/${facilityId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setFacility(data.data?.venue || data.venue || data.data);
                setCourts(data.data?.venue?.courts || data.venue?.courts || data.data?.courts || []);
            } else {
                throw new Error(data.message || 'Failed to load facility');
            }
        } catch (err) {
            console.error('Fetch facility error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourt = async () => {
        if (!courtForm.name || !courtForm.pricePerHour) return;

        setSavingCourt(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/venues/${facilityId}/courts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: courtForm.name,
                    sportType: courtForm.sportType,
                    pricePerHour: parseFloat(courtForm.pricePerHour),
                    description: courtForm.description
                })
            });

            const data = await res.json();

            if (data.success) {
                setCourts(prev => [...prev, data.court || data.data?.court]);
                setShowAddCourtModal(false);
                resetCourtForm();
            } else {
                throw new Error(data.message || 'Failed to add court');
            }
        } catch (err) {
            console.error('Add court error:', err);
            setError(err.message);
        } finally {
            setSavingCourt(false);
        }
    };

    const handleUpdateCourt = async () => {
        if (!editingCourt || !courtForm.name || !courtForm.pricePerHour) return;

        setSavingCourt(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/courts/${editingCourt.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: courtForm.name,
                    sportType: courtForm.sportType,
                    pricePerHour: parseFloat(courtForm.pricePerHour),
                    description: courtForm.description
                })
            });

            const data = await res.json();

            if (data.success) {
                setCourts(prev => prev.map(c =>
                    c.id === editingCourt.id
                        ? { ...c, ...courtForm, pricePerHour: parseFloat(courtForm.pricePerHour) }
                        : c
                ));
                setEditingCourt(null);
                resetCourtForm();
            } else {
                throw new Error(data.message || 'Failed to update court');
            }
        } catch (err) {
            console.error('Update court error:', err);
            setError(err.message);
        } finally {
            setSavingCourt(false);
        }
    };

    const handleDeleteCourt = async (courtId) => {
        setDeletingCourtId(courtId);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/courts/${courtId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setCourts(prev => prev.filter(c => c.id !== courtId));
            } else {
                throw new Error(data.message || 'Failed to delete court');
            }
        } catch (err) {
            console.error('Delete court error:', err);
            setError(err.message);
        } finally {
            setDeletingCourtId(null);
        }
    };

    const resetCourtForm = () => {
        setCourtForm({
            name: '',
            sportType: 'BADMINTON',
            pricePerHour: '',
            description: ''
        });
    };

    const openEditCourtModal = (court) => {
        setEditingCourt(court);
        setCourtForm({
            name: court.name,
            sportType: court.sportType,
            pricePerHour: court.pricePerHour.toString(),
            description: court.description || ''
        });
    };

    const getSportIcon = (sportType) => {
        const sport = sportTypes.find(s => s.value === sportType);
        return sport?.icon || '🏆';
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'APPROVED':
                return {
                    iconName: 'check_circle',
                    pillClass: 'pill',
                    label: 'Active'
                };
            case 'PENDING':
                return {
                    iconName: 'schedule',
                    pillClass: 'pill secondary',
                    label: 'Pending'
                };
            case 'REJECTED':
                return {
                    iconName: 'cancel',
                    pillClass: 'pill error',
                    label: 'Rejected'
                };
            default:
                return {
                    iconName: 'domain',
                    pillClass: 'pill neutral',
                    label: status
                };
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center">
                <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
            </div>
        );
    }

    if (error && !facility) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="error" size={32} className="text-error" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">Error Loading Facility</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/owner/facilities">
                            <button className="btn btn-outline">
                                Back to Facilities
                            </button>
                        </Link>
                        <button
                            onClick={fetchFacilityDetails}
                            className="btn btn-cta"
                        >
                            <Icon name="refresh" size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(facility?.status);

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/owner/facilities"
                        className="text-sm text-primary hover:opacity-80 flex items-center gap-1 mb-4"
                    >
                        <Icon name="chevron_left" size={16} />
                        Back to Facilities
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h1 className="font-display text-2xl sm:text-4xl font-semibold text-on-surface tracking-tight">
                                    {facility?.name}
                                </h1>
                                {statusConfig && (
                                    <span className={statusConfig.pillClass}>
                                        <Icon name={statusConfig.iconName} size={14} />
                                        {statusConfig.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                                <Icon name="location_on" size={16} />
                                <span>{facility?.address}, {facility?.city}</span>
                            </div>
                        </div>
                        <Link href={`/owner/facilities/${facilityId}/edit`}>
                            <button className="btn btn-cta btn-sm">
                                <Icon name="edit" size={16} />
                                Edit Facility
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-error-container/40 border border-error/30 text-on-error-container rounded-2xl p-4 flex items-center gap-3 mb-6">
                        <Icon name="error" size={20} className="shrink-0 text-error" />
                        <p className="text-sm">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <Icon name="close" size={16} />
                        </button>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="card p-5">
                        <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-3">
                            <Icon name="domain" size={20} />
                        </div>
                        <p className="font-display font-semibold text-[28px] leading-none text-on-surface font-mono">{courts.length}</p>
                        <p className="text-xs text-on-surface-variant mt-2">Courts</p>
                    </div>
                    <div className="card p-5">
                        <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-3">
                            <Icon name="calendar_today" size={20} />
                        </div>
                        <p className="font-display font-semibold text-[28px] leading-none text-on-surface font-mono">{facility?.totalBookings || 0}</p>
                        <p className="text-xs text-on-surface-variant mt-2">Bookings</p>
                    </div>
                    <div className="card p-5">
                        <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center mb-3">
                            <Icon name="payments" size={20} />
                        </div>
                        <p className="font-display font-semibold text-[28px] leading-none text-on-surface font-mono">₹{((facility?.totalEarnings || 0) / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-on-surface-variant mt-2">Revenue</p>
                    </div>
                    <div className="card p-5">
                        <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center mb-3">
                            <Icon name="star" filled size={20} />
                        </div>
                        <p className="font-display font-semibold text-[28px] leading-none text-on-surface font-mono">{facility?.rating || '-'}</p>
                        <p className="text-xs text-on-surface-variant mt-2">{facility?.reviewCount || 0} reviews</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="card overflow-hidden">
                    <div className="border-b border-outline-variant px-6">
                        <div className="flex gap-7">
                            {[
                                { id: 'courts', label: 'Courts', icon: 'sports', count: courts.length },
                                { id: 'photos', label: 'Photos', icon: 'photo_library', count: null },
                                { id: 'blocked', label: 'Blocked Slots', icon: 'event_busy', count: null },
                                { id: 'details', label: 'Details', icon: 'info', count: null }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab inline-flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    <Icon name={tab.icon} size={16} />
                                    {tab.label}
                                    {tab.count !== null && (
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                            activeTab === tab.id
                                                ? 'bg-primary-container text-on-primary-container'
                                                : 'bg-surface-container text-on-surface-variant'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Courts Tab */}
                    {activeTab === 'courts' && (
                        <div className="p-6 anim-fade">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-display text-xl font-semibold text-on-surface">Courts</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">{courts.length} courts</p>
                                </div>
                                <button
                                    onClick={() => setShowAddCourtModal(true)}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Icon name="add" size={16} />
                                    Add Court
                                </button>
                            </div>

                            {courts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courts.map((court) => (
                                        <div
                                            key={court.id}
                                            className="card card-hover p-5"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center text-xl">
                                                        {getSportIcon(court.sportType)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-display text-on-surface font-semibold">{court.name}</h4>
                                                        <p className="text-sm text-on-surface-variant">{court.sportType?.replace(/_/g, ' ')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditCourtModal(court)}
                                                        className="p-2 hover:bg-surface-container rounded-lg transition-colors"
                                                    >
                                                        <Icon name="edit" size={16} className="text-on-surface-variant" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourt(court.id)}
                                                        disabled={deletingCourtId === court.id}
                                                        className="p-2 hover:bg-error-container/40 rounded-lg transition-colors"
                                                    >
                                                        {deletingCourtId === court.id ? (
                                                            <Icon name="progress_activity" size={16} className="text-on-surface-variant animate-spin" />
                                                        ) : (
                                                            <Icon name="delete" size={16} className="text-error" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
                                                <div>
                                                    <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.08em]">Price / hr</p>
                                                    <p className="font-mono text-on-surface font-semibold text-xl mt-0.5">₹{court.pricePerHour}</p>
                                                </div>
                                                <span className={court.isActive !== false ? 'pill' : 'pill neutral'}>
                                                    {court.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                                        <Icon name="domain" size={32} className="text-on-surface-variant" />
                                    </div>
                                    <h3 className="font-display text-on-surface font-semibold mb-1">No Courts Yet</h3>
                                    <p className="text-sm text-on-surface-variant mb-4">
                                        Add courts to start accepting bookings.
                                    </p>
                                    <button
                                        onClick={() => setShowAddCourtModal(true)}
                                        className="btn btn-primary"
                                    >
                                        <Icon name="add" size={16} />
                                        Add Your First Court
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Photos Tab */}
                    {activeTab === 'photos' && (
                        <div className="p-6 anim-fade">
                            <div className="mb-6">
                                <h3 className="font-display text-xl font-semibold text-on-surface mb-1">Photos</h3>
                                <p className="text-sm text-on-surface-variant">
                                    Upload photos that showcase your facility. The first photo is used as the cover image.
                                </p>
                            </div>
                            <FacilityPhotosManager venueId={facilityId} />
                        </div>
                    )}

                    {/* Blocked Slots Tab */}
                    {activeTab === 'blocked' && (
                        <div className="p-6 anim-fade">
                            <BlockSlotsManager courts={courts} />
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="p-6 anim-fade">
                            <h3 className="font-display text-xl font-semibold text-on-surface mb-6">Facility details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-2">Description</h4>
                                    <p className="text-on-surface-variant text-sm leading-relaxed">{facility?.description || 'No description provided.'}</p>
                                </div>
                                <div>
                                    <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-2">Contact</h4>
                                    <div className="space-y-2 text-on-surface-variant text-sm">
                                        {facility?.phone && <p className="font-mono">📞 {facility.phone}</p>}
                                        {facility?.email && <p className="font-mono">✉️ {facility.email}</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-2">Location</h4>
                                    <div className="text-on-surface-variant text-sm">
                                        <p>{facility?.address}</p>
                                        <p className="font-mono mt-1">{facility?.city}, {facility?.state} {facility?.pincode}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-2">Amenities</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {facility?.amenities?.length > 0 ? (
                                            facility.amenities.map((amenity, idx) => (
                                                <span key={idx} className="pill neutral normal-case tracking-normal">
                                                    {amenity}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-on-surface-variant text-sm">No amenities listed</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add/Edit Court Modal */}
                {(showAddCourtModal || editingCourt) && (
                    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="card max-w-md w-full p-6 anim-slide-up">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display text-xl font-semibold text-on-surface">
                                    {editingCourt ? 'Edit Court' : 'Add New Court'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowAddCourtModal(false);
                                        setEditingCourt(null);
                                        resetCourtForm();
                                    }}
                                    className="p-1 rounded-lg hover:bg-surface-container transition-colors"
                                >
                                    <Icon name="close" size={20} className="text-on-surface-variant" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                        Court Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={courtForm.name}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="input"
                                        placeholder="e.g., Court 1"
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                        Sport Type *
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {sportTypes.map((sport) => {
                                            const selected = courtForm.sportType === sport.value;
                                            return (
                                                <button
                                                    type="button"
                                                    key={sport.value}
                                                    onClick={() => setCourtForm(prev => ({ ...prev, sportType: sport.value }))}
                                                    className={`rounded-xl p-3 cursor-pointer flex flex-col items-center gap-1 transition-all border ${
                                                        selected
                                                            ? 'border-primary bg-primary-container text-on-primary-container'
                                                            : 'border-outline-variant hover:border-primary text-on-surface'
                                                    }`}
                                                >
                                                    <span className="text-2xl">{sport.icon}</span>
                                                    <span className="text-xs font-medium">{sport.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                        Price per Hour (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        value={courtForm.pricePerHour}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, pricePerHour: e.target.value }))}
                                        className="input font-mono"
                                        placeholder="500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={courtForm.description}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="input resize-none"
                                        placeholder="Any special features or details about this court..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddCourtModal(false);
                                        setEditingCourt(null);
                                        resetCourtForm();
                                    }}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingCourt ? handleUpdateCourt : handleAddCourt}
                                    disabled={savingCourt || !courtForm.name || !courtForm.pricePerHour}
                                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingCourt ? (
                                        <Icon name="progress_activity" size={20} className="animate-spin" />
                                    ) : editingCourt ? (
                                        'Update Court'
                                    ) : (
                                        'Add Court'
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
