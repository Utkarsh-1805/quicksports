'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '../../contexts/AuthContext';

export function FavoritesSection() {
    const { user, token } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user && token) {
            fetchFavorites();
        } else {
            setLoading(false);
        }
    }, [user, token]);

    const fetchFavorites = async () => {
        try {
            const response = await fetch('/api/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setFavorites(data.data.favorites);
            }
        } catch (err) {
            setError('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (venueId) => {
        try {
            const response = await fetch(`/api/favorites?venueId=${venueId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setFavorites(favorites.filter(f => f.venue.id !== venueId));
            }
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        }
    };

    if (!user) {
        return (
            <div className="card p-8 text-center">
                <Icon name="favorite_border" size={48} className="text-on-surface-variant mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-on-surface mb-2">Login to view favorites</h3>
                <p className="text-on-surface-variant mb-4">Save your favorite venues for quick access</p>
                <Link href="/auth/login" className="btn btn-cta btn-sm">
                    Login
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card p-6 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl p-4 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-surface-container-high rounded-lg" />
                            <div className="flex-1">
                                <div className="h-5 bg-surface-container-high rounded w-3/4 mb-2" />
                                <div className="h-4 bg-surface-container rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-error-container text-on-error-container rounded-xl p-4 text-center">
                {error}
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="card p-8 text-center">
                <Icon name="favorite_border" size={48} className="text-on-surface-variant mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-on-surface mb-2">No favorites yet</h3>
                <p className="text-on-surface-variant mb-4">Browse venues and click the heart to save them</p>
                <Link href="/venues" className="btn btn-cta btn-sm">
                    Explore Venues
                </Link>
            </div>
        );
    }

    return (
        <div className="card p-[22px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-on-surface">Your favorites</h3>
                <Icon name="favorite" filled className="text-secondary-container" size={16} />
            </div>

            <div className="flex flex-col gap-3">
                {favorites.map((fav) => (
                    <div
                        key={fav.id}
                        className="card card-hover overflow-hidden"
                    >
                        <div className="flex">
                            {/* Image */}
                            <Link href={`/venues/${fav.venue.id}`} className="w-32 h-28 flex-shrink-0">
                                <img
                                    src={fav.venue.thumbnail || '/placeholder-venue.jpg'}
                                    alt={fav.venue.name}
                                    className="w-full h-full object-cover"
                                />
                            </Link>

                            {/* Content */}
                            <div className="flex-1 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Link
                                            href={`/venues/${fav.venue.id}`}
                                            className="font-display font-semibold text-on-surface hover:text-primary transition-colors"
                                        >
                                            {fav.venue.name}
                                        </Link>
                                        <div className="flex items-center gap-1 text-on-surface-variant text-sm mt-1">
                                            <Icon name="location_on" size={14} />
                                            {fav.venue.city}
                                        </div>
                                        {fav.venue.sportType && (
                                            <span className="pill neutral mt-2" style={{ textTransform: 'none', letterSpacing: 0 }}>
                                                {fav.venue.sportType}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeFavorite(fav.venue.id)}
                                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                                        title="Remove from favorites"
                                    >
                                        <Icon name="delete" size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Icon name="star" filled className="text-secondary-container" size={16} />
                                        <span className="font-mono font-medium text-on-surface">{fav.venue.averageRating?.toFixed(1) || '-'}</span>
                                    </div>
                                    {fav.venue.minPrice && (
                                        <span className="text-sm text-on-surface-variant">
                                            From <span className="font-mono font-semibold text-primary">₹{fav.venue.minPrice}/hr</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Link href="/venues" className="btn btn-outline btn-sm w-full mt-4">
                Explore venues
            </Link>
        </div>
    );
}
