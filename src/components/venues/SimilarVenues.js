'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useApi } from '@/contexts';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

function SimilarVenueCard({ venue }) {
  const startingPrice = venue.courts?.length > 0
    ? Math.min(...venue.courts.map(c => c.pricePerHour))
    : venue.startingPrice || null;

  const sportTypes = venue.courts?.map(c => c.sportType) || venue.sportTypes || [];
  const uniqueSports = [...new Set(sportTypes)].slice(0, 2);

  return (
    <Link href={`/venues/${venue.id}`}>
      <div className="card card-hover overflow-hidden flex flex-col group">
        {/* Image */}
        <div className="relative bg-surface-container overflow-hidden" style={{ aspectRatio: '16 / 11' }}>
          {venue.photos?.[0]?.url || venue.coverImage ? (
            <img
              src={venue.photos?.[0]?.url || venue.coverImage}
              alt={venue.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="court-tile w-full h-full flex items-center justify-center text-on-surface-variant">
              <Icon name="location_on" size={32} />
            </div>
          )}
          {/* Rating Badge */}
          {venue.averageRating && (
            <div className="absolute top-3 right-3 bg-surface-container-lowest px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <Icon name="star" filled size={14} className="text-secondary-container" />
              <span className="font-mono text-on-surface">{venue.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-[18px] flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg text-on-surface truncate group-hover:text-primary transition-colors" style={{ lineHeight: 1.2 }}>
                {venue.name}
              </h3>
              <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1 truncate">
                <Icon name="location_on" size={14} className="shrink-0" />
                {venue.city}, {venue.state}
              </p>
            </div>
            {/* Price */}
            {startingPrice && (
              <div className="text-right shrink-0">
                <div className="font-mono text-lg font-semibold text-on-surface">{formatCurrency(startingPrice)}</div>
                <div className="font-mono text-xs text-on-surface-variant mt-0.5">/hr</div>
              </div>
            )}
          </div>

          {/* Sports Tags */}
          {uniqueSports.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {uniqueSports.map(sport => (
                <span
                  key={sport}
                  className="pill neutral"
                  style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit' }}
                >
                  {sport.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SimilarVenueCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="bg-surface-container" style={{ aspectRatio: '16 / 11' }} />
      <div className="p-[18px] space-y-2">
        <div className="h-5 bg-surface-container rounded w-3/4" />
        <div className="h-4 bg-surface-container-low rounded w-1/2" />
        <div className="flex gap-1.5 mt-2">
          <div className="h-5 bg-surface-container-low rounded-full w-16" />
          <div className="h-5 bg-surface-container-low rounded-full w-12" />
        </div>
        <div className="h-4 bg-surface-container-low rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

export function SimilarVenues({ venueId, limit = 4 }) {
  const { venue: venueApi } = useApi();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const { success, data, error: apiError } = await venueApi.getSimilar(venueId, limit);
        if (success && data?.venues) {
          setVenues(data.venues);
        } else if (apiError) {
          setError(apiError);
        }
      } catch (err) {
        setError('Failed to load similar venues');
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchSimilar();
    }
  }, [venueApi, venueId, limit]);

  // Don't render section if no similar venues found
  if (!loading && venues.length === 0) {
    return null;
  }

  return (
    <section className="pt-8 mt-8 border-t border-outline-variant">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-on-surface">Similar Venues</h2>
          <p className="text-on-surface-variant mt-1">Other facilities you might like</p>
        </div>
        <Link
          href="/venues"
          className="text-primary font-semibold hover:opacity-80 flex items-center gap-1 group"
        >
          View all
          <Icon name="chevron_right" size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(limit)].map((_, i) => (
            <SimilarVenueCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="text-on-surface-variant text-center py-8">Unable to load similar venues</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {venues.map((venue) => (
            <SimilarVenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </section>
  );
}

export default SimilarVenues;
