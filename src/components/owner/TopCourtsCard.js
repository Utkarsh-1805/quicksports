'use client';

import Link from 'next/link';
import { Trophy, ChevronRight, TrendingUp } from 'lucide-react';

/**
 * TopCourtsCard Component
 * Displays top performing courts for owner dashboard
 */
export function TopCourtsCard({ courts = [], loading = false }) {
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

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-36 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                            <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Calculate max for progress bars
    const maxBookings = Math.max(...courts.map(c => c.bookingCount || 0), 1);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Top Courts</h3>
                        <p className="text-sm text-slate-500">Best performing courts</p>
                    </div>
                </div>
                <Link
                    href="/owner/facilities"
                    className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1"
                >
                    View All
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Courts List */}
            {courts.length > 0 ? (
                <div className="space-y-4">
                    {courts.map((court, index) => (
                        <div key={court.id} className="group">
                            <div className="flex items-center gap-3 mb-2">
                                {/* Rank Badge */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-600' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    #{index + 1}
                                </div>
                                
                                {/* Court Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getSportIcon(court.sportType)}</span>
                                        <p className="font-medium text-slate-900 truncate">{court.name}</p>
                                    </div>
                                </div>
                                
                                {/* Stats */}
                                <div className="text-right shrink-0">
                                    <p className="font-semibold text-slate-900">₹{(court.revenue || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{court.bookingCount} bookings</p>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="ml-11">
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(court.bookingCount / maxBookings) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No court data available</p>
                </div>
            )}
        </div>
    );
}

export default TopCourtsCard;
