'use client';

import { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
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
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Login to view favorites</h3>
                <p className="text-slate-500 mb-4">Save your favorite venues for quick access</p>
                <Link 
                    href="/auth/login"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Login
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-slate-200 rounded-lg" />
                            <div className="flex-1">
                                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                                <div className="h-4 bg-slate-100 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 rounded-xl p-4 text-center">
                {error}
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No favorites yet</h3>
                <p className="text-slate-500 mb-4">Browse venues and click the heart to save them</p>
                <Link 
                    href="/venues"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Explore Venues
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    My Favorites ({favorites.length})
                </h2>
            </div>

            {favorites.map((fav) => (
                <div 
                    key={fav.id} 
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
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
                                        className="font-semibold text-slate-800 hover:text-green-600 transition-colors"
                                    >
                                        {fav.venue.name}
                                    </Link>
                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {fav.venue.city}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFavorite(fav.venue.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove from favorites"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium">{fav.venue.averageRating?.toFixed(1) || '-'}</span>
                                </div>
                                {fav.venue.minPrice && (
                                    <span className="text-sm text-slate-600">
                                        From <span className="font-semibold">₹{fav.venue.minPrice}/hr</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
