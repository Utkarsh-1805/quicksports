'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, Heart } from 'lucide-react';

export function VenueCard({ venue }) {
    const [isFavorite, setIsFavorite] = useState(false);

    // Gracefully handle images (use the placeholder gradient if none provided)
    const imageUrl = venue.thumbnail || (venue.photos && venue.photos.length > 0
        ? venue.photos[0].url || venue.photos[0]
        : 'bg-gradient-to-tr from-slate-200 to-slate-100'); // Default gray

    const isGradient = imageUrl.startsWith('bg-');

    // Safe fallbacks from API
    const rating = venue.averageRating || venue.rating || '4.5';
    const reviewCount = venue.reviewCount || 0;

    // Price range logic
    let priceDisplay = '₹---';
    if (venue.priceRange) {
        priceDisplay = `₹${venue.priceRange.min}`;
    } else if (venue.courts?.length > 0) {
        priceDisplay = `₹${Math.min(...venue.courts.map(c => c.pricePerHour))}`;
    }

    const toggleFavorite = (e) => {
        e.preventDefault(); // prevent simple Link navigation
        setIsFavorite(!isFavorite);
    };

    return (
        <Link
            href={`/venues/${venue.id}`}
            className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-slate-100 group cursor-pointer flex flex-col h-full hover:-translate-y-1 relative"
        >
            {/* Image Box */}
            <div className={`h-56 w-full relative overflow-hidden ${isGradient ? imageUrl : 'bg-slate-100'}`}>
                {!isGradient && (
                    <img
                        src={imageUrl}
                        alt={venue.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}

                {/* Floating Rating Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-sm z-10">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    {rating} ({reviewCount})
                </div>

                {/* Favorite Toggle */}
                <button
                    onClick={toggleFavorite}
                    className="absolute top-4 left-4 w-9 h-9 bg-white/50 hover:bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors z-10"
                >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col flex-grow">

                {/* Sports Badges */}
                {venue.sportTypes && venue.sportTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {venue.sportTypes.slice(0, 3).map((sport, i) => (
                            <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                {sport.replace('_', ' ')}
                            </span>
                        ))}
                        {venue.sportTypes.length > 3 && (
                            <span className="text-[10px] font-bold uppercase text-slate-400 px-1 py-1">
                                +{venue.sportTypes.length - 3} MORE
                            </span>
                        )}
                    </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-green-600 transition-colors">
                    {venue.name}
                </h3>

                <div className="flex items-center gap-1.5 text-slate-500 mb-6 text-sm">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{venue.address}{venue.city && `, ${venue.city}`}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-0.5">Starts from</span>
                        <div className="text-lg font-bold text-slate-900">
                            {priceDisplay}
                            <span className="text-sm font-normal text-slate-500">/hr</span>
                        </div>
                    </div>
                    <button className="bg-slate-50 hover:bg-green-50 text-slate-700 hover:text-green-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm border border-slate-200 hover:border-green-200">
                        Book Now
                    </button>
                </div>
            </div>
        </Link>
    );
}

// Skeleton loader for async boundary
export function VenueCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full animate-pulse">
            <div className="h-56 w-full bg-slate-200"></div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="h-6 w-3/4 bg-slate-200 rounded-md mb-4"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded-md mb-6"></div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="h-3 w-16 bg-slate-100 rounded mb-2"></div>
                        <div className="h-6 w-20 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-10 w-24 bg-slate-100 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}
