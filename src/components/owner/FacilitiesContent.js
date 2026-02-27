'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Building2, 
    Plus, 
    Search,
    MapPin,
    Star,
    Calendar,
    MoreVertical,
    Pencil,
    Trash2,
    Eye,
    CheckCircle,
    Clock,
    XCircle,
    ChevronRight,
    Loader2,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

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
                    color: 'text-green-600', 
                    bg: 'bg-green-50 border-green-200',
                    label: 'Active'
                };
            case 'PENDING':
                return { 
                    icon: Clock, 
                    color: 'text-yellow-600', 
                    bg: 'bg-yellow-50 border-yellow-200',
                    label: 'Pending Review'
                };
            case 'REJECTED':
                return { 
                    icon: XCircle, 
                    color: 'text-red-600', 
                    bg: 'bg-red-50 border-red-200',
                    label: 'Rejected'
                };
            default:
                return { 
                    icon: Building2, 
                    color: 'text-slate-600', 
                    bg: 'bg-slate-50 border-slate-200',
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
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-10 w-36 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                                <div className="h-40 bg-slate-200 rounded-xl mb-4 animate-pulse"></div>
                                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-2"></div>
                                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                        ))}
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
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Facilities</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchFacilities}>
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Facilities</h1>
                        <p className="text-slate-500 mt-1">Manage your sports venues and courts</p>
                    </div>
                    <Link href="/owner/facilities/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Facility
                        </Button>
                    </Link>
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
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search facilities..."
                                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                            />
                        </div>

                        {/* Status Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'APPROVED', label: 'Active' },
                                { value: 'PENDING', label: 'Pending' },
                                { value: 'REJECTED', label: 'Rejected' }
                            ].map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                        statusFilter === tab.value
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                        statusFilter === tab.value
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {statusCounts[tab.value]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Facilities Grid */}
                {filteredFacilities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFacilities.map((facility) => {
                            const statusConfig = getStatusConfig(facility.status);
                            const StatusIcon = statusConfig.icon;
                            
                            return (
                                <div
                                    key={facility.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all group"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                        <Building2 className="w-16 h-16 text-purple-300" />
                                        
                                        {/* Status Badge */}
                                        <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusConfig.label}
                                        </div>

                                        {/* Actions Menu */}
                                        <div className="absolute top-4 right-4">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === facility.id ? null : facility.id)}
                                                className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-slate-600" />
                                            </button>
                                            
                                            {activeMenu === facility.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                                                        <Link
                                                            href={`/owner/facilities/${facility.id}`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Details
                                                        </Link>
                                                        <Link
                                                            href={`/owner/facilities/${facility.id}/edit`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                            Edit Facility
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setFacilityToDelete(facility);
                                                                setShowDeleteModal(true);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                                            {facility.name}
                                        </h3>
                                        
                                        <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                                            <MapPin className="w-4 h-4" />
                                            <span>{facility.city}</span>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                                                <p className="font-bold text-slate-900">{facility.totalCourts || 0}</p>
                                                <p className="text-xs text-slate-500">Courts</p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                                                <p className="font-bold text-slate-900">{facility.totalBookings || 0}</p>
                                                <p className="text-xs text-slate-500">Bookings</p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-400" />
                                                    <span className="font-bold text-slate-900">{facility.rating || '-'}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">Rating</p>
                                            </div>
                                        </div>

                                        {/* Revenue */}
                                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-4">
                                            <p className="text-xs text-green-600 font-medium">Total Revenue</p>
                                            <p className="text-xl font-bold text-green-900">
                                                ₹{(facility.totalEarnings || 0).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Action Button */}
                                        <Link
                                            href={`/owner/facilities/${facility.id}`}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors"
                                        >
                                            Manage Facility
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {searchQuery || statusFilter !== 'all' ? 'No Facilities Found' : 'No Facilities Yet'}
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            {searchQuery || statusFilter !== 'all' 
                                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                : 'Create your first facility to start accepting bookings from customers.'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                            <Link href="/owner/facilities/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Your First Facility
                                </Button>
                            </Link>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                                Delete Facility?
                            </h3>
                            <p className="text-slate-500 text-center mb-6">
                                Are you sure you want to delete <strong>{facilityToDelete?.name}</strong>? 
                                This action cannot be undone and will remove all associated courts and bookings.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setFacilityToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deletingId === facilityToDelete?.id}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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
