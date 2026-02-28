'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * FavoriteButton Component
 * A reusable heart button that toggles favorite status via API
 * 
 * @param {string} venueId - The facility/venue ID
 * @param {boolean} initialFavorite - Initial favorite state
 * @param {string} className - Additional CSS classes
 * @param {function} onToggle - Callback when favorite is toggled (faved: boolean)
 */
export function FavoriteButton({ venueId, initialFavorite = false, className = '', onToggle }) {
    const { user, getToken } = useAuth();
    const [isFavorite, setIsFavorite] = useState(initialFavorite);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsFavorite(initialFavorite);
    }, [initialFavorite]);

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const token = getToken();
        if (!user || !token) {
            // Could show login prompt here
            alert('Please login to save favorites');
            return;
        }

        if (isLoading) return;

        setIsLoading(true);
        const newState = !isFavorite;

        try {
            if (newState) {
                // Add to favorites
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ venueId })
                });

                const data = await response.json();
                if (data.success) {
                    setIsFavorite(true);
                    onToggle?.(true);
                }
            } else {
                // Remove from favorites
                const response = await fetch(`/api/favorites?venueId=${venueId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (data.success) {
                    setIsFavorite(false);
                    onToggle?.(false);
                }
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={isLoading}
            className={`w-9 h-9 bg-white/50 hover:bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
                isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'
            } ${className}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart 
                className={`w-5 h-5 transition-all duration-200 ${
                    isFavorite 
                        ? 'fill-red-500 text-red-500 scale-110' 
                        : 'text-slate-400 hover:text-red-500'
                }`} 
            />
        </button>
    );
}
