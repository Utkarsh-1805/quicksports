'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

// Fallback while /api/venues/filters loads (also the deterministic default if the API errors)
const FALLBACK_SPORTS = [
    { id: 'TENNIS', label: 'Tennis', icon: '🎾' },
    { id: 'BADMINTON', label: 'Badminton', icon: '🏸' },
    { id: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
    { id: 'FOOTBALL', label: 'Football', icon: '⚽' },
    { id: 'SWIMMING', label: 'Swimming', icon: '🏊‍♂️' },
    { id: 'TABLE_TENNIS', label: 'Table Tennis', icon: '🏓' },
];

const SPORT_ICONS = {
    TENNIS: '🎾',
    BADMINTON: '🏸',
    BASKETBALL: '🏀',
    FOOTBALL: '⚽',
    SWIMMING: '🏊‍♂️',
    TABLE_TENNIS: '🏓',
    CRICKET: '🏏',
    VOLLEYBALL: '🏐',
};

const FALLBACK_AMENITIES = [
    { id: 'PARKING', label: 'Parking' },
    { id: 'WASHROOM', label: 'Washroom' },
    { id: 'CHANGING_ROOM', label: 'Changing Room' },
    { id: 'DRINKING_WATER', label: 'Drinking Water' },
    { id: 'EQUIPMENT_RENTAL', label: 'Equipment Rental' },
    { id: 'CAFETARIA', label: 'Cafeteria' },
    { id: 'FIRST_AID', label: 'First Aid' },
    { id: 'WIFI', label: 'Free WiFi' },
];

const FALLBACK_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

const prettifySportLabel = (raw) =>
    String(raw)
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

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

    // Live filter options from /api/venues/filters
    const [SPORTS, setSPORTS] = useState(FALLBACK_SPORTS);
    const [AMENITIES, setAMENITIES] = useState(FALLBACK_AMENITIES);
    const [CITIES, setCITIES] = useState(FALLBACK_CITIES);
    const [priceBounds, setPriceBounds] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/venues/filters');
                if (!res.ok) return;
                const json = await res.json();
                if (cancelled || !json?.success) return;
                const d = json.data || {};
                if (Array.isArray(d.cities) && d.cities.length) {
                    setCITIES(d.cities.map((c) => (typeof c === 'string' ? c : c.city)).filter(Boolean));
                }
                if (Array.isArray(d.sports) && d.sports.length) {
                    setSPORTS(
                        d.sports.map((s) => {
                            const id = typeof s === 'string' ? s : s.sportType || s.id;
                            return { id, label: prettifySportLabel(id), icon: SPORT_ICONS[id] || '🏆' };
                        })
                    );
                }
                if (Array.isArray(d.amenities) && d.amenities.length) {
                    setAMENITIES(
                        d.amenities.map((a) => ({
                            id: a.id || a.name || a,
                            label: a.name || a.label || prettifySportLabel(a.id || a),
                        }))
                    );
                }
                if (d.priceRange) setPriceBounds(d.priceRange);
            } catch (err) {
                console.error('Filter options fetch error:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Synchronize local filter state when server/URL payload changes
    useEffect(() => {
        if (initialFilters) {
            // eslint-disable-next-line
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
        <div className={`card p-6 ${isMobile ? 'h-full flex flex-col' : ''}`}>

            <div className="flex items-center justify-between mb-7">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-widest flex items-center gap-2 text-on-surface">
                    <Icon name="tune" size={16} className="text-primary" />
                    Filters
                </h3>
                {Object.values(filters).some(val => Array.isArray(val) ? val.length > 0 : val) && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-primary hover:opacity-80 font-semibold transition-opacity"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className={`space-y-8 ${isMobile ? 'flex-grow overflow-y-auto pr-2' : ''}`}>

                {/* City Filter */}
                <div>
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                        <Icon name="location_on" size={14} className="text-on-surface-variant" /> Location
                    </h4>
                    <div className="relative">
                        <select
                            value={filters.city}
                            onChange={(e) => updateFilters({ city: e.target.value })}
                            className="w-full appearance-none bg-surface-container-low border border-outline-variant text-on-surface py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                        >
                            <option value="">All Cities</option>
                            {CITIES.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                            <Icon name="expand_more" size={20} />
                        </div>
                    </div>
                </div>

                {/* Sports Categories */}
                <div className="border-t border-outline-variant pt-6">
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Sport</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {SPORTS.map(sport => {
                            const isSelected = filters.sportTypes.includes(sport.id);
                            return (
                                <button
                                    key={sport.id}
                                    onClick={() => handleSportToggle(sport.id)}
                                    className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-full text-sm font-medium transition-all text-left border
                    ${isSelected
                                            ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                                            : 'bg-transparent text-on-surface border-outline-variant hover:bg-surface-container'
                                        }
                  `}
                                >
                                    <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"' }}>
                                        {sport.icon}
                                    </span>
                                    <span className="truncate">{sport.label}</span>
                                    {isSelected && <Icon name="check" size={16} className="ml-auto shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Price Range */}
                <div className="border-t border-outline-variant pt-6">
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Price per hour (₹)</h4>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">₹</span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => updateFilters({ minPrice: e.target.value })}
                                className="w-full bg-surface-container-low border border-outline-variant text-on-surface py-2 pl-7 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-on-surface-variant"
                            />
                        </div>
                        <span className="text-on-surface-variant">-</span>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">₹</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                                className="w-full bg-surface-container-low border border-outline-variant text-on-surface py-2 pl-7 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-on-surface-variant"
                            />
                        </div>
                    </div>
                </div>

                {/* Rating */}
                <div className="border-t border-outline-variant pt-6">
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Minimum rating</h4>
                    <div className="flex flex-col gap-2">
                        {[4, 3, 2, 1].map(rating => (
                            <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="rating"
                                    value={rating}
                                    checked={filters.minRating === rating}
                                    onChange={() => updateFilters({ minRating: rating })}
                                    className="w-4 h-4 text-primary focus:ring-primary border-outline-variant cursor-pointer"
                                />
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Icon
                                            key={i}
                                            name="star"
                                            filled={i < rating}
                                            size={16}
                                            className={`${i < rating ? 'text-secondary-container' : 'text-outline-variant'} group-hover:scale-110 transition-transform`}
                                        />
                                    ))}
                                    <span className="ml-1 text-on-surface text-sm font-medium">& Up</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Amenities */}
                <div className="border-t border-outline-variant pt-6">
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Amenities</h4>
                    <div className="space-y-3">
                        {AMENITIES.map(amenity => {
                            const isChecked = filters.amenities.includes(amenity.id);
                            return (
                                <label key={amenity.id} className="flex items-center gap-3 cursor-pointer select-none group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={isChecked}
                                            onChange={() => handleAmenityToggle(amenity.id)}
                                        />
                                        <div
                                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2 ${isChecked
                                                ? 'bg-primary border-2 border-primary'
                                                : 'bg-surface-container-lowest border-2 border-outline-variant group-hover:border-primary'
                                                }`}
                                        >
                                            {isChecked && (
                                                <Icon name="check" size={14} className="text-on-primary" />
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-on-surface text-sm font-medium group-hover:text-on-surface transition-colors">
                                        {amenity.label}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Mobile Sticky Footer */}
            {isMobile && (
                <div className="mt-6 pt-4 border-t border-outline-variant pb-2">
                    <Button
                        fullWidth
                        className="shadow-lg"
                        onClick={() => {/* Prop passed to close modal */ }}
                    >
                        Show Results
                    </Button>
                </div>
            )}
        </div>
    );
}
