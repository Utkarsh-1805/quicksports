'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);

function readCookieToken() {
    if (typeof document === 'undefined') return null;
    return (
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('quickcourt_token='))
            ?.split('=')[1] || null
    );
}

function RecommendationCard({ venue }) {
    return (
        <Link
            href={`/venues/${venue.id}`}
            className="card card-hover min-w-[260px] max-w-[260px] overflow-hidden group"
        >
            <div className="relative h-36 bg-surface-container overflow-hidden">
                {venue.coverImage ? (
                    <img
                        src={venue.coverImage}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                        <Icon name="sports" size={32} />
                    </div>
                )}
                {venue.averageRating && (
                    <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                        <Icon name="star" filled size={12} className="text-secondary-container" />
                        <span className="font-mono text-on-surface">{venue.averageRating.toFixed(1)}</span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-display font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                    {venue.name}
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 truncate">
                    <Icon name="location_on" size={12} />
                    {venue.city}
                </p>
                {Array.isArray(venue.reasons?.sharedSports) && venue.reasons.sharedSports.length > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2.5 px-2 py-1 rounded-full bg-primary-container text-on-primary-container text-[11px] font-semibold">
                        <Icon name="auto_awesome" size={12} />
                        Matches your {venue.reasons.sharedSports[0].toLowerCase().replace('_', ' ')} bookings
                    </span>
                )}
                {!venue.reasons?.sharedSports?.length && venue.reasons?.sameCity && (
                    <span className="inline-flex items-center gap-1 mt-2.5 px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                        <Icon name="near_me" size={12} />
                        In your city
                    </span>
                )}
                {venue.startingPrice && (
                    <p className="mt-2.5 text-sm">
                        <span className="font-mono font-semibold text-primary">
                            {formatCurrency(venue.startingPrice)}
                        </span>
                        <span className="text-on-surface-variant font-mono"> / hr</span>
                    </p>
                )}
            </div>
        </Link>
    );
}

function SkeletonCard() {
    return (
        <div className="card min-w-[260px] max-w-[260px] overflow-hidden animate-pulse">
            <div className="h-36 bg-surface-container" />
            <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-container rounded w-3/4" />
                <div className="h-3 bg-surface-container-low rounded w-1/2" />
                <div className="h-3 bg-surface-container-low rounded w-2/3 mt-2" />
            </div>
        </div>
    );
}

export default function RecommendedForYou({ limit = 8 }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const token = readCookieToken();
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/users/me/recommendations?limit=${limit}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (cancelled) return;
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.message || 'Could not load recommendations.');
                }
            } catch (err) {
                if (!cancelled) setError('Network error.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [limit]);

    if (loading) {
        return (
            <section className="bg-surface py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display text-2xl font-semibold text-on-surface mb-4">Picking venues for you…</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error || !data || data.recommendations.length === 0) {
        return null;
    }

    const profileBased = data.strategy === 'preference-based';
    const headline = profileBased ? 'Recommended for you' : 'Popular right now';
    const subline = profileBased
        ? `Based on ${data.profile.bookingsAnalyzed} recent booking${data.profile.bookingsAnalyzed === 1 ? '' : 's'}` +
          (data.profile.topSports.length > 0
              ? ` · favorites: ${data.profile.topSports.map((s) => s.toLowerCase().replace('_', ' ')).join(', ')}`
              : '')
        : 'Top-rated venues you might enjoy';

    return (
        <section className="bg-surface py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <h2 className="font-display text-2xl md:text-3xl font-semibold text-on-surface flex items-center gap-2 tracking-tight">
                            <Icon name="auto_awesome" size={24} className="text-primary" />
                            {headline}
                        </h2>
                        <p className="text-sm text-on-surface-variant mt-1.5">{subline}</p>
                    </div>
                    <Link
                        href="/venues"
                        className="text-sm font-semibold text-primary hover:text-primary-container hidden sm:inline-flex items-center gap-1"
                    >
                        See all venues
                        <Icon name="chevron_right" size={14} />
                    </Link>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-px-4">
                    {data.recommendations.map((v) => (
                        <div key={v.id} className="snap-start">
                            <RecommendationCard venue={v} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
