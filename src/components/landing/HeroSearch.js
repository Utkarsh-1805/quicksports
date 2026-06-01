'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

const SPORTS_LIST = [
    'Badminton', 'Tennis', 'Basketball', 'Football',
    'Cricket', 'Swimming', 'Table Tennis', 'Volleyball'
];

export function HeroSearch() {
    const router = useRouter();
    const [location, setLocation] = useState('');
    const [sport, setSport] = useState('');
    const [date, setDate] = useState('');
    const [isSportDropdownOpen, setIsSportDropdownOpen] = useState(false);
    const [cities, setCities] = useState([]);
    const [usingLocation, setUsingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');

    // Load cities for the autocomplete datalist
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/venues/cities?limit=20');
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled || !data?.success) return;
                const list = (data.data?.cities || []).map((c) => c.city).filter(Boolean);
                setCities(list);
            } catch (err) {
                console.error('Fetch cities error:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleUseMyLocation = () => {
        setLocationError('');
        if (!navigator?.geolocation) {
            setLocationError('Geolocation is not supported in this browser.');
            return;
        }
        setUsingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(`/api/venues/nearby?latitude=${latitude}&longitude=${longitude}&radius=25&limit=1`);
                    const data = await res.json();
                    const nearest = data?.data?.venues?.[0];
                    if (nearest?.city) {
                        setLocation(nearest.city);
                        const params = new URLSearchParams();
                        params.append('city', nearest.city);
                        if (sport) params.append('sportType', sport.toUpperCase().replace(' ', '_'));
                        router.push(`/venues?${params.toString()}`);
                    } else {
                        setLocationError('No venues found near you. Try expanding the search.');
                    }
                } catch (err) {
                    console.error('Nearby search error:', err);
                    setLocationError('Could not find nearby venues. Please try again.');
                } finally {
                    setUsingLocation(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setUsingLocation(false);
                setLocationError(
                    err.code === err.PERMISSION_DENIED
                        ? 'Location permission denied. Type your city instead.'
                        : 'Could not get your location. Type your city instead.'
                );
            },
            { enableHighAccuracy: false, timeout: 8000 }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (location) params.append('city', location);
        if (sport) params.append('sportType', sport.toUpperCase().replace(' ', '_'));
        const qs = params.toString();
        router.push(`/venues${qs ? `?${qs}` : ''}`);
    };

    return (
      <div className="max-w-4xl mx-auto">
        <form
            onSubmit={handleSearch}
            className="bg-surface/10 backdrop-blur-xl border border-surface/20 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col md:flex-row gap-3"
        >
            {/* Sport */}
            <div className="flex-1 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3 border-l-4 border-primary relative">
                <Icon name="sports_tennis" className="text-outline mr-3" size={22} />
                <button
                    type="button"
                    onClick={() => setIsSportDropdownOpen(!isSportDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsSportDropdownOpen(false), 200)}
                    className="w-full bg-transparent text-left text-on-surface text-base"
                >
                    {sport || <span className="text-outline-variant">What sport?</span>}
                </button>

                {isSportDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant overflow-hidden z-30 max-h-60 overflow-y-auto">
                        <div
                            className="px-4 py-3 hover:bg-surface-container-low cursor-pointer text-on-surface font-medium border-b border-outline-variant"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setSport(''); setIsSportDropdownOpen(false); }}
                        >
                            Any Sport
                        </div>
                        {SPORTS_LIST.map((s) => (
                            <div
                                key={s}
                                className="px-4 py-3 hover:bg-primary-container hover:text-on-primary-container cursor-pointer text-on-surface-variant transition-colors"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setSport(s); setIsSportDropdownOpen(false); }}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Location */}
            <div className="flex-1 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3">
                <Icon name="location_on" className="text-outline mr-3" size={22} />
                <input
                    type="text"
                    list="hero-cities"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 placeholder:text-outline-variant outline-none"
                />
                <datalist id="hero-cities">
                    {cities.map((c) => (
                        <option key={c} value={c} />
                    ))}
                </datalist>
                <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={usingLocation}
                    title="Use my current location"
                    aria-label="Use my current location"
                    className="ml-2 shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-primary hover:bg-primary-container/40 disabled:opacity-50"
                >
                    <Icon name={usingLocation ? 'progress_activity' : 'my_location'} size={18} className={usingLocation ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Date */}
            <div className="flex-1 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3">
                <Icon name="calendar_today" className="text-outline mr-3" size={22} />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 outline-none"
                />
            </div>

            <button
                type="submit"
                className="bg-secondary text-on-secondary px-8 py-3 rounded-xl font-semibold text-base hover:bg-secondary-container hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 min-w-[140px]"
            >
                <Icon name="search" size={22} />
                Search
            </button>
        </form>
        {locationError && (
            <p className="mt-2 text-sm text-surface-container-lowest bg-error/70 backdrop-blur-sm rounded-md px-3 py-2 inline-block">
                {locationError}
            </p>
        )}
      </div>
    );
}
