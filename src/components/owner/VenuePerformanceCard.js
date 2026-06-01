'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/**
 * VenuePerformanceCard Component
 * Displays performance metrics for each venue
 */
export function VenuePerformanceCard({ venues = [], loading = false }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'APPROVED':
                return {
                    iconName: 'check_circle',
                    pill: 'pill',
                    label: 'Active'
                };
            case 'PENDING':
                return {
                    iconName: 'schedule',
                    pill: 'pill secondary',
                    label: 'Pending'
                };
            case 'REJECTED':
                return {
                    iconName: 'cancel',
                    pill: 'pill error',
                    label: 'Rejected'
                };
            default:
                return {
                    iconName: 'domain',
                    pill: 'pill neutral',
                    label: status
                };
        }
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-40 bg-surface-container-high rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-surface-container-high rounded animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-4 border border-outline-variant/40 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-surface-container-high rounded-xl animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-32 bg-surface-container-high rounded animate-pulse"></div>
                                    <div className="h-4 w-24 bg-surface-container rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-base font-semibold text-on-surface">Venue performance</h3>
                <Link
                    href="/owner/facilities"
                    className="text-sm text-primary font-semibold hover:opacity-80 flex items-center gap-1"
                >
                    Manage
                    <Icon name="arrow_forward" size={14} />
                </Link>
            </div>

            {/* Venues List */}
            {venues.length > 0 ? (
                <div className="space-y-4">
                    {venues.map((venue) => {
                        const statusConfig = getStatusConfig(venue.status);

                        return (
                            <Link
                                key={venue.id}
                                href={`/owner/facilities/${venue.id}`}
                                className="block p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Venue Image Placeholder */}
                                    <div className="w-16 h-16 rounded-2xl court-tile flex items-center justify-center shrink-0">
                                        <Icon name="domain" size={28} className="text-primary" />
                                    </div>

                                    {/* Venue Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h4 className="font-display font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                                                {venue.name}
                                            </h4>
                                            <span className={statusConfig.pill}>
                                                <Icon name={statusConfig.iconName} size={12} />
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-sm text-on-surface-variant mb-3">
                                            <Icon name="location_on" size={14} />
                                            <span>{venue.city}</span>
                                            <span className="text-on-surface-variant/40 mx-1">•</span>
                                            <span className="font-mono">{venue.totalCourts}</span>
                                            <span>courts</span>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center p-2.5 bg-surface-container-lowest rounded-xl">
                                                <p className="font-display text-lg font-semibold text-on-surface font-mono">
                                                    {venue.totalBookings || 0}
                                                </p>
                                                <p className="text-xs text-on-surface-variant">Bookings</p>
                                            </div>
                                            <div className="text-center p-2.5 bg-surface-container-lowest rounded-xl">
                                                <p className="font-display text-lg font-semibold text-on-surface font-mono">
                                                    ₹{((venue.totalEarnings || 0) / 1000).toFixed(1)}k
                                                </p>
                                                <p className="text-xs text-on-surface-variant">Revenue</p>
                                            </div>
                                            <div className="text-center p-2.5 bg-surface-container-lowest rounded-xl">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Icon name="star" size={16} className="text-secondary-container" filled />
                                                    <span className="font-display text-lg font-semibold text-on-surface font-mono">
                                                        {venue.rating || '-'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-on-surface-variant">{venue.reviewCount || 0} reviews</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Icon name="chevron_right" size={20} className="text-on-surface-variant/40 shrink-0 group-hover:text-primary transition-colors" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="domain" size={32} className="text-on-surface-variant/60" />
                    </div>
                    <h3 className="font-display font-semibold text-on-surface mb-1">No Venues Yet</h3>
                    <p className="text-sm text-on-surface-variant mb-4">
                        Create your first venue to start accepting bookings.
                    </p>
                    <Link
                        href="/owner/facilities/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                        <Icon name="add" size={18} />
                        Add Your First Venue
                    </Link>
                </div>
            )}
        </div>
    );
}

export default VenuePerformanceCard;
