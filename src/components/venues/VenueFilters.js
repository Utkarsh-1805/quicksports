'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Filter, X, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Mock data for filters (would ideally come from an API endpoint like /api/venues/filters)
const SPORTS = [
    { id: 'TENNIS', label: 'Tennis', icon: '🎾' },
    { id: 'BADMINTON', label: 'Badminton', icon: '🏸' },
    { id: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
    { id: 'FOOTBALL', label: 'Football', icon: '⚽' },
    { id: 'SWIMMING', label: 'Swimming', icon: '🏊‍♂️' },
    { id: 'TABLE_TENNIS', label: 'Table Tennis', icon: '🏓' },
];

const AMENITIES = [
    { id: 'PARKING', label: 'Parking' },
    { id: 'WASHROOM', label: 'Washroom' },
    { id: 'CHANGING_ROOM', label: 'Changing Room' },
    { id: 'DRINKING_WATER', label: 'Drinking Water' },
    { id: 'EQUIPMENT_RENTAL', label: 'Equipment Rental' },
    { id: 'CAFETARIA', label: 'Cafeteria' },
    { id: 'FIRST_AID', label: 'First Aid' },
    { id: 'WIFI', label: 'Free WiFi' },
];

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

export function VenueFilters({ initialFilters, onFilterChange, isMobile = false }) {
    const [filters, setFilters] = useState({
        sportTypes: initialFilters?.sportTypes || [],
        city: initialFilters?.city || '',
        minPrice: initialFilters?.minPrice || '',
        maxPrice: initialFilters?.maxPrice || '',
        minRating: initialFilters?.minRating || '',
        amenities: initialFilters?.amenities || [],
        ...initialFilters
    });

    // Synchronize local filter state when server/URL payload changes
    useEffect(() => {
        if (initialFilters) {
            setFilters(prev => ({
                ...prev,
                sportTypes: initialFilters.sportTypes || [],
                city: initialFilters.city || '',
                minPrice: initialFilters.minPrice || '',
                maxPrice: initialFilters.maxPrice || '',
                minRating: initialFilters.minRating || '',
                amenities: initialFilters.amenities || [],
                ...initialFilters
            }));
        }
    }, [initialFilters]);

    const handleSportToggle = (sportId) => {
        const newSportTypes = filters.sportTypes.includes(sportId)
            ? filters.sportTypes.filter(s => s !== sportId)
            : [...filters.sportTypes, sportId];

        updateFilters({ sportTypes: newSportTypes });
    };

    const handleAmenityToggle = (amenityId) => {
        const newAmenities = filters.amenities.includes(amenityId)
            ? filters.amenities.filter(a => a !== amenityId)
            : [...filters.amenities, amenityId];

        updateFilters({ amenities: newAmenities });
    };

    const updateFilters = (changes) => {
        const newFilters = { ...filters, ...changes };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters = {
            sportTypes: [],
            city: '',
            minPrice: '',
            maxPrice: '',
            minRating: '',
            amenities: []
        };
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    return (
        <div className={`bg-white rounded-3xl border border-slate-100 p-6 shadow-sm ${isMobile ? 'h-full flex flex-col' : 'sticky top-28'}`}>

            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                    <Filter className="w-5 h-5 text-green-600" />
                    Filters
                </h3>
                {Object.values(filters).some(val => Array.isArray(val) ? val.length > 0 : val) && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className={`space-y-8 ${isMobile ? 'flex-grow overflow-y-auto pr-2' : ''}`}>

                {/* City Filter */}
                <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" /> Location
                    </h4>
                    <div className="relative">
                        <select
                            value={filters.city}
                            onChange={(e) => updateFilters({ city: e.target.value })}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
                        >
                            <option value="">All Cities</option>
                            {CITIES.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Sports Categories */}
                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Sports</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {SPORTS.map(sport => {
                            const isSelected = filters.sportTypes.includes(sport.id);
                            return (
                                <button
                                    key={sport.id}
                                    onClick={() => handleSportToggle(sport.id)}
                                    className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                    ${isSelected
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-slate-200 text-slate-600 hover:border-green-300 hover:bg-slate-50'
                                        }
                  `}
                                >
                                    <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"' }}>
                                        {sport.icon}
                                    </span>
                                    <span className="truncate">{sport.label}</span>
                                    {isSelected && <Check className="w-4 h-4 ml-auto text-green-600 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Price Range */}
                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Price Range (₹/hr)</h4>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => updateFilters({ minPrice: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-2 pl-7 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <span className="text-slate-400">-</span>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-2 pl-7 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Rating */}
                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Minimum Rating</h4>
                    <div className="flex flex-col gap-2">
                        {[4, 3, 2, 1].map(rating => (
                            <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="rating"
                                    value={rating}
                                    checked={filters.minRating === rating}
                                    onChange={() => updateFilters({ minRating: rating })}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-slate-300 cursor-pointer"
                                />
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} group-hover:scale-110 transition-transform`}
                                        />
                                    ))}
                                    <span className="ml-1 text-sm text-slate-600 font-medium">& Up</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Amenities */}
                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-semibold text-slate-900 mb-3">Amenities</h4>
                    <div className="space-y-3">
                        {AMENITIES.map(amenity => (
                            <label key={amenity.id} className="flex items-center gap-3 cursor-pointer select-none group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={filters.amenities.includes(amenity.id)}
                                        onChange={() => handleAmenityToggle(amenity.id)}
                                    />
                                    <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-green-500/50 peer-focus-visible:ring-offset-2"></div>
                                    <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                    {amenity.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

            </div>

            {/* Mobile Sticky Footer */}
            {isMobile && (
                <div className="mt-6 pt-4 border-t border-slate-100 pb-2">
                    <Button
                        fullWidth
                        className="shadow-lg shadow-green-500/20"
                        onClick={() => {/* Prop passed to close modal */ }}
                    >
                        Show Results
                    </Button>
                </div>
            )}
        </div>
    );
}
