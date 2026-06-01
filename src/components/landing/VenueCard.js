'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { FavoriteButton } from '../ui/FavoriteButton';

export function VenueCard({ venue, isFavorite = false }) {
    const imageUrl = venue.thumbnail || (venue.photos && venue.photos.length > 0
        ? (venue.photos[0].url || venue.photos[0])
        : null);

    const rating = venue.averageRating || venue.rating || '4.5';
    const reviewCount = venue.reviewCount || 0;

    let priceDisplay = '₹---';
    if (venue.priceRange) {
        priceDisplay = `₹${venue.priceRange.min}`;
    } else if (venue.courts?.length > 0) {
        priceDisplay = `₹${Math.min(...venue.courts.map(c => c.pricePerHour))}`;
    }

    const primarySport = venue.sportTypes?.[0]?.replace('_', ' ') || 'Sports';

    return (
        <Link
            href={`/venues/${venue.id}`}
            className="group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col"
        >
            <div className="relative h-48 w-full overflow-hidden bg-surface-container-high">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={venue.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}

                {/* Top right: rating + favorite */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    <div className="bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Icon name="star" filled className="text-secondary" size={16} />
                        <span className="font-mono text-xs text-on-surface">{rating}</span>
                        {reviewCount > 0 && <span className="text-xs text-on-surface-variant">({reviewCount})</span>}
                    </div>
                    <FavoriteButton
                        venueId={venue.id}
                        initialFavorite={isFavorite}
                        className="w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
                    />
                </div>

                {/* Bottom left: sport pill */}
                <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2.5 py-1 bg-primary-container text-on-primary-container rounded-full font-mono text-[12px] uppercase tracking-wider font-bold">
                        {primarySport}
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="text-xl font-semibold text-on-surface leading-tight group-hover:text-primary transition-colors">
                        {venue.name}
                    </h3>
                    <div className="text-right shrink-0">
                        <span className="block font-mono text-on-surface text-lg font-semibold">{priceDisplay}</span>
                        <span className="block text-xs text-on-surface-variant">/ hr</span>
                    </div>
                </div>

                <p className="text-sm text-on-surface-variant mb-4 flex items-center gap-1">
                    <Icon name="location_on" size={16} />
                    <span className="truncate">{venue.city || venue.address}</span>
                </p>

                {venue.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {venue.amenities.slice(0, 2).map((a, i) => (
                            <span key={i} className="px-2 py-1 bg-surface-container text-on-surface-variant rounded text-[12px] font-medium flex items-center gap-1">
                                <Icon name="check_circle" size={14} />
                                {typeof a === 'string' ? a : a.name}
                            </span>
                        ))}
                    </div>
                )}

                <button className="mt-auto w-full py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:bg-secondary hover:text-on-secondary transition-colors">
                    Book Court
                </button>
            </div>
        </Link>
    );
}

export function VenueCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col h-full animate-pulse">
            <div className="h-48 w-full bg-surface-container-high" />
            <div className="p-5 flex flex-col flex-1">
                <div className="h-6 w-3/4 bg-surface-container-high rounded-md mb-3" />
                <div className="h-4 w-1/2 bg-surface-container rounded-md mb-6" />
                <div className="h-10 w-full bg-surface-container rounded-lg mt-auto" />
            </div>
        </div>
    );
}
