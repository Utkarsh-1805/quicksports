'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
    Building2, 
    MapPin, 
    Clock, 
    Star,
    Plus,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    RefreshCw,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    MoreVertical,
    Settings,
    Eye,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

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
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' };
            case 'PENDING':
                return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' };
            case 'REJECTED':
                return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' };
            default:
                return { icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50', label: status };
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (error && !facility) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Facility</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/owner/facilities">
                            <Button variant="outline">Back to Facilities</Button>
                        </Link>
                        <Button onClick={fetchFacilityDetails}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(facility?.status);
    const StatusIcon = statusConfig?.icon;

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link 
                        href="/owner/facilities"
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Facilities
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                                    {facility?.name}
                                </h1>
                                {statusConfig && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusConfig.label}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <MapPin className="w-4 h-4" />
                                <span>{facility?.address}, {facility?.city}</span>
                            </div>
                        </div>
                        <Link href={`/owner/facilities/${facilityId}/edit`}>
                            <Button variant="outline">
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Facility
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{courts.length}</p>
                                <p className="text-xs text-slate-500">Courts</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{facility?.totalBookings || 0}</p>
                                <p className="text-xs text-slate-500">Bookings</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">₹{((facility?.totalEarnings || 0) / 1000).toFixed(1)}k</p>
                                <p className="text-xs text-slate-500">Revenue</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                                <Star className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="text-2xl font-bold text-slate-900">{facility?.rating || '-'}</p>
                                </div>
                                <p className="text-xs text-slate-500">{facility?.reviewCount || 0} reviews</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200">
                        <div className="flex gap-1 p-2">
                            {[
                                { id: 'courts', label: 'Courts', count: courts.length },
                                { id: 'details', label: 'Details', count: null }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-purple-50 text-purple-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count !== null && (
                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                            activeTab === tab.id
                                                ? 'bg-purple-200 text-purple-800'
                                                : 'bg-slate-200 text-slate-600'
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
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg text-slate-900">Manage Courts</h3>
                                <Button onClick={() => setShowAddCourtModal(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Court
                                </Button>
                            </div>

                            {courts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courts.map((court) => (
                                        <div
                                            key={court.id}
                                            className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-purple-200 transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl">
                                                        {getSportIcon(court.sportType)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{court.name}</h4>
                                                        <p className="text-sm text-slate-500">{court.sportType?.replace(/_/g, ' ')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditCourtModal(court)}
                                                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCourt(court.id)}
                                                        disabled={deletingCourtId === court.id}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        {deletingCourtId === court.id ? (
                                                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                                <div>
                                                    <p className="text-xs text-slate-500">Price per hour</p>
                                                    <p className="text-lg font-bold text-purple-600">₹{court.pricePerHour}</p>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    court.isActive !== false ? 'bg-green-50 text-green-600' : 'bg-slate-200 text-slate-500'
                                                }`}>
                                                    {court.isActive !== false ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Building2 className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="font-medium text-slate-900 mb-1">No Courts Yet</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Add courts to start accepting bookings.
                                    </p>
                                    <Button onClick={() => setShowAddCourtModal(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Your First Court
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Description</h4>
                                    <p className="text-slate-600">{facility?.description || 'No description provided.'}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Contact</h4>
                                    <div className="space-y-2 text-slate-600">
                                        {facility?.phone && <p>📞 {facility.phone}</p>}
                                        {facility?.email && <p>✉️ {facility.email}</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Location</h4>
                                    <div className="text-slate-600">
                                        <p>{facility?.address}</p>
                                        <p>{facility?.city}, {facility?.state} {facility?.pincode}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3">Amenities</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {facility?.amenities?.length > 0 ? (
                                            facility.amenities.map((amenity, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                                                    {amenity}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-slate-500">No amenities listed</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add/Edit Court Modal */}
                {(showAddCourtModal || editingCourt) && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">
                                {editingCourt ? 'Edit Court' : 'Add New Court'}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Court Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={courtForm.name}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="e.g., Court 1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Sport Type *
                                    </label>
                                    <select
                                        value={courtForm.sportType}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, sportType: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                    >
                                        {sportTypes.map((sport) => (
                                            <option key={sport.value} value={sport.value}>
                                                {sport.icon} {sport.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Price per Hour (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        value={courtForm.pricePerHour}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, pricePerHour: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={courtForm.description}
                                        onChange={(e) => setCourtForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
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
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <Button
                                    onClick={editingCourt ? handleUpdateCourt : handleAddCourt}
                                    disabled={savingCourt || !courtForm.name || !courtForm.pricePerHour}
                                    className="flex-1"
                                >
                                    {savingCourt ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : editingCourt ? (
                                        'Update Court'
                                    ) : (
                                        'Add Court'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
