'use client';

import Link from 'next/link';
import { 
    Building2, 
    MapPin, 
    Star, 
    TrendingUp,
    ChevronRight,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

/**
 * VenuePerformanceCard Component
 * Displays performance metrics for each venue
 */
export function VenuePerformanceCard({ venues = [], loading = false }) {
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
                    label: 'Pending'
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

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-40 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-xl animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Your Venues</h3>
                        <p className="text-sm text-slate-500">Performance overview</p>
                    </div>
                </div>
                <Link
                    href="/owner/facilities"
                    className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1"
                >
                    Manage
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Venues List */}
            {venues.length > 0 ? (
                <div className="space-y-4">
                    {venues.map((venue) => {
                        const statusConfig = getStatusConfig(venue.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <Link
                                key={venue.id}
                                href={`/owner/facilities/${venue.id}`}
                                className="block p-4 border border-slate-200 rounded-xl hover:border-purple-200 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Venue Image Placeholder */}
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shrink-0">
                                        <Building2 className="w-8 h-8 text-purple-400" />
                                    </div>
                                    
                                    {/* Venue Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                                                {venue.name}
                                            </h4>
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusConfig.bg} ${statusConfig.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.label}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{venue.city}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{venue.totalCourts} courts</span>
                                        </div>
                                        
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center p-2 bg-purple-50 rounded-lg">
                                                <p className="text-lg font-bold text-purple-900">
                                                    {venue.totalBookings || 0}
                                                </p>
                                                <p className="text-xs text-purple-600">Bookings</p>
                                            </div>
                                            <div className="text-center p-2 bg-green-50 rounded-lg">
                                                <p className="text-lg font-bold text-green-900">
                                                    ₹{((venue.totalEarnings || 0) / 1000).toFixed(1)}k
                                                </p>
                                                <p className="text-xs text-green-600">Revenue</p>
                                            </div>
                                            <div className="text-center p-2 bg-yellow-50 rounded-lg">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                                                    <span className="text-lg font-bold text-yellow-900">
                                                        {venue.rating || '-'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-yellow-600">{venue.reviewCount || 0} reviews</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-purple-500 transition-colors" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-1">No Venues Yet</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Create your first venue to start accepting bookings.
                    </p>
                    <Link
                        href="/owner/facilities/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        Add Your First Venue
                    </Link>
                </div>
            )}
        </div>
    );
}

export default VenuePerformanceCard;
