'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

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
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-36 bg-surface-container-high rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-surface-container-high rounded animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-surface-container-high rounded-lg animate-pulse"></div>
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-16 bg-surface-container rounded animate-pulse"></div>
                            </div>
                            <div className="h-4 w-16 bg-surface-container-high rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Calculate max for progress bars
    const maxBookings = Math.max(...courts.map(c => c.bookingCount || 0), 1);

    return (
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-base font-semibold text-on-surface">Top courts</h3>
                <Link
                    href="/owner/facilities"
                    className="text-sm text-primary font-semibold hover:opacity-80 flex items-center gap-1"
                >
                    View all
                    <Icon name="arrow_forward" size={14} />
                </Link>
            </div>

            {/* Courts List */}
            {courts.length > 0 ? (
                <div className="flex flex-col gap-3.5">
                    {courts.map((court, index) => (
                        <div key={court.id} className="flex items-center gap-3">
                            {/* Rank */}
                            <span className="font-mono text-[11px] text-on-surface-variant w-4 shrink-0">
                                {String(index + 1).padStart(2, '0')}
                            </span>

                            {/* Court Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-on-surface truncate flex items-center gap-1.5">
                                    <span>{getSportIcon(court.sportType)}</span>
                                    <span className="truncate">{court.name}</span>
                                </div>
                                <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                                    {court.sportType?.replace('_', ' ').toLowerCase() || 'Sport'} · {court.bookingCount || 0} bookings
                                </div>
                                {/* Progress Bar */}
                                <div className="h-1 bg-surface-container rounded-full overflow-hidden mt-1.5">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${(court.bookingCount / maxBookings) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Revenue */}
                            <span className="font-mono text-sm font-semibold text-on-surface shrink-0">
                                ₹{((court.revenue || 0) / 1000).toFixed(0)}k
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="emoji_events" size={32} className="text-on-surface-variant/60" />
                    </div>
                    <p className="text-on-surface-variant">No court data available</p>
                </div>
            )}
        </div>
    );
}

export default TopCourtsCard;
