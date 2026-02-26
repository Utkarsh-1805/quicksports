'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    ChevronRight, 
    Clock, 
    Users,
    Zap,
    Star,
    Calendar,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * CourtSelector Component
 * Displays available courts at a venue with booking CTAs
 */
export function CourtSelector({ courts = [], venueId, venueName }) {
    const [selectedSport, setSelectedSport] = useState('all');

    // Get unique sport types
    const sportTypes = ['all', ...new Set(courts.map(c => c.sportType))];

    // Filter courts by sport type
    const filteredCourts = selectedSport === 'all' 
        ? courts 
        : courts.filter(c => c.sportType === selectedSport);

    const getSportIcon = (sportType) => {
        const icons = {
            'TENNIS': '🎾',
            'BADMINTON': '🏸',
            'BASKETBALL': '🏀',
            'FOOTBALL': '⚽',
            'TABLE_TENNIS': '🏓',
            'SWIMMING': '🏊',
            'CRICKET': '🏏',
            'VOLLEYBALL': '🏐',
            'SQUASH': '🎾'
        };
        return icons[sportType] || '🏆';
    };

    const getSportLabel = (sportType) => {
        return sportType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0 
        }).format(amount);
    };

    if (courts.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Courts Available</h3>
                <p className="text-slate-500">This venue doesn't have any active courts at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sport Type Filter */}
            {sportTypes.length > 2 && (
                <div className="flex flex-wrap gap-2">
                    {sportTypes.map((sport) => (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={`
                                px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                                ${selectedSport === sport
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }
                            `}
                        >
                            {sport === 'all' ? 'All Sports' : (
                                <span className="flex items-center gap-2">
                                    <span>{getSportIcon(sport)}</span>
                                    {getSportLabel(sport)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Courts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourts.map((court) => (
                    <div 
                        key={court.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-lg transition-all duration-300 group"
                    >
                        {/* Court Header */}
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        {getSportIcon(court.sportType)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                                            {court.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 capitalize">
                                            {getSportLabel(court.sportType)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(court.pricePerHour)}</p>
                                    <p className="text-xs text-slate-400">per hour</p>
                                </div>
                            </div>

                            {/* Court Features */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {court.openingTime && court.closingTime && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs text-slate-600">
                                        <Clock className="w-3.5 h-3.5" />
                                        {court.openingTime} - {court.closingTime}
                                    </div>
                                )}
                                {court.surface && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs text-slate-600">
                                        <Info className="w-3.5 h-3.5" />
                                        {court.surface}
                                    </div>
                                )}
                                {court.indoor !== undefined && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs text-slate-600">
                                        <Zap className="w-3.5 h-3.5" />
                                        {court.indoor ? 'Indoor' : 'Outdoor'}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {court.description && (
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                    {court.description}
                                </p>
                            )}
                        </div>

                        {/* Book Button */}
                        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                            <Link href={`/booking/${court.id}`}>
                                <Button fullWidth className="group-hover:shadow-lg group-hover:shadow-green-500/20 transition-shadow">
                                    Book This Court
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Results Count */}
            <p className="text-center text-sm text-slate-500">
                Showing {filteredCourts.length} of {courts.length} court{courts.length !== 1 ? 's' : ''}
            </p>
        </div>
    );
}

export default CourtSelector;
