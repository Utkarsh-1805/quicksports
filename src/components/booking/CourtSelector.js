'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

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
            <div className="card p-8 text-center">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="calendar_today" size={32} className="text-on-surface-variant" />
                </div>
                <h3 className="font-display text-lg text-on-surface mb-2">No Courts Available</h3>
                <p className="text-on-surface-variant">This venue doesn&apos;t have any active courts at the moment.</p>
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
                                px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 border
                                ${selectedSport === sport
                                    ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                                    : 'bg-transparent text-on-surface border-outline-variant hover:bg-surface-container'
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
                        className="card card-hover cursor-pointer overflow-hidden group"
                    >
                        {/* Court Header */}
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        {getSportIcon(court.sportType)}
                                    </div>
                                    <div>
                                        <h3 className="font-display text-lg text-on-surface group-hover:text-primary transition-colors">
                                            {court.name}
                                        </h3>
                                        <p className="text-on-surface-variant text-sm capitalize">
                                            {getSportLabel(court.sportType)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-semibold text-on-surface text-xl">{formatCurrency(court.pricePerHour)}</p>
                                    <p className="text-xs text-on-surface-variant font-mono">per hour</p>
                                </div>
                            </div>

                            {/* Court Features */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {court.openingTime && court.closingTime && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full text-xs text-on-surface-variant font-mono">
                                        <Icon name="schedule" size={14} />
                                        {court.openingTime} - {court.closingTime}
                                    </div>
                                )}
                                {court.surface && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full text-xs text-on-surface-variant">
                                        <Icon name="info" size={14} />
                                        {court.surface}
                                    </div>
                                )}
                                {court.indoor !== undefined && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full text-xs text-on-surface-variant">
                                        <Icon name="bolt" size={14} />
                                        {court.indoor ? 'Indoor' : 'Outdoor'}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {court.description && (
                                <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">
                                    {court.description}
                                </p>
                            )}
                        </div>

                        {/* Book Button */}
                        <div className="px-5 py-4 bg-surface-container-low border-t border-outline-variant">
                            <Link
                                href={`/booking/${court.id}`}
                                className="btn btn-cta w-full"
                            >
                                Book This Court
                                <Icon name="arrow_forward" size={16} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Results Count */}
            <p className="text-center text-sm text-on-surface-variant font-mono">
                Showing {filteredCourts.length} of {courts.length} court{courts.length !== 1 ? 's' : ''}
            </p>
        </div>
    );
}

export default CourtSelector;
