'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Custom hook for debouncing input
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function SearchBar({ initialQuery = '', onSearch }) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);

    const debouncedQuery = useDebounce(query, 300);

    // Fetch suggestions when debounced query changes
    useEffect(() => {
        async function fetchSuggestions() {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/venues/suggestions?query=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const response = await res.json();
                    if (response.success && response.data) {
                        const { venues = [], cities = [], sports = [] } = response.data.suggestions || {};
                        setSuggestions({ venues, cities, sports });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch search suggestions", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSuggestions();
    }, [debouncedQuery]);

    // Handle clicking outside to close suggestions dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsFocused(false);
        if (onSearch) {
            onSearch(query, 'text');
        } else {
            router.push(`/venues?search=${encodeURIComponent(query)}`);
        }
    };

    const handleVenueClick = (venueId) => {
        setIsFocused(false);
        router.push(`/venues/${venueId}`);
    };

    const handleCategorySearch = (type, value) => {
        setIsFocused(false);
        setQuery(value);
        if (onSearch) {
            onSearch(value, type);
        } else {
            if (type === 'city') {
                router.push(`/venues?city=${encodeURIComponent(value)}`);
            } else if (type === 'sport') {
                router.push(`/venues?sportType=${encodeURIComponent(value)}`);
            }
        }
    };

    const hasSuggestions = suggestions.venues?.length > 0 || suggestions.cities?.length > 0 || suggestions.sports?.length > 0;

    return (
        <div ref={searchRef} className="relative w-full z-30">
            <form onSubmit={handleSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all"
                    placeholder="Search for venues by name or location..."
                    autoComplete="off"
                />
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
                    </div>
                )}
            </form>

            {/* Autocomplete Dropdown */}
            {isFocused && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
                    {hasSuggestions ? (
                        <div className="py-2 max-h-80 overflow-y-auto">

                            {/* Sports Category */}
                            {suggestions.sports && suggestions.sports.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="px-5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Sports</h4>
                                    <ul>
                                        {suggestions.sports.map((sport) => (
                                            <li key={`sport-${sport.name}`}>
                                                <button
                                                    onClick={() => handleCategorySearch('sport', sport.name)}
                                                    className="w-full text-left px-5 py-2 hover:bg-slate-50 focus:bg-slate-50 transition-colors flex items-center justify-between"
                                                >
                                                    <span className="font-semibold text-slate-900 capitalize">{sport.name.replace('_', ' ').toLowerCase()}</span>
                                                    <span className="text-xs text-slate-500">{sport.venueCount} venues</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Cities Category */}
                            {suggestions.cities && suggestions.cities.length > 0 && (
                                <div className="mb-2">
                                    <h4 className="px-5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Cities</h4>
                                    <ul>
                                        {suggestions.cities.map((city) => (
                                            <li key={`city-${city.name}`}>
                                                <button
                                                    onClick={() => handleCategorySearch('city', city.name)}
                                                    className="w-full text-left px-5 py-2 hover:bg-slate-50 focus:bg-slate-50 transition-colors flex items-center gap-2"
                                                >
                                                    <span className="font-semibold text-slate-900">{city.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Venues Category */}
                            {suggestions.venues && suggestions.venues.length > 0 && (
                                <div>
                                    <h4 className="px-5 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Venues</h4>
                                    <ul>
                                        {suggestions.venues.map((venue) => (
                                            <li key={`venue-${venue.id}`}>
                                                <button
                                                    onClick={() => handleVenueClick(venue.id)}
                                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 focus:bg-slate-50 transition-colors flex flex-col items-start gap-1"
                                                >
                                                    <span className="font-semibold text-slate-900">{venue.name}</span>
                                                    <span className="text-sm text-slate-500">{venue.city}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="px-5 py-6 text-center text-slate-500">
                            {isLoading ? 'Searching...' : `No results found matching "${query}"`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
