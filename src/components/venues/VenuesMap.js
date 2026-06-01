'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

// Fix the well-known Leaflet missing-marker-icon issue with bundlers.
// Override default icon paths to use the CDN-hosted PNGs.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
    className: 'quickcourt-user-marker',
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#1976D2;border:3px solid white;box-shadow:0 0 0 2px #1976D2"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const venueIcon = (sport) => {
    const emojiMap = {
        BADMINTON: '🏸', TENNIS: '🎾', BASKETBALL: '🏀', FOOTBALL: '⚽',
        CRICKET: '🏏', SWIMMING: '🏊', TABLE_TENNIS: '🏓', VOLLEYBALL: '🏐',
    };
    const emoji = emojiMap[sport] || '🏟️';
    return L.divIcon({
        className: 'quickcourt-venue-marker',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid #006b2c;box-shadow:0 2px 6px rgba(0,0,0,0.25)">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};

function RecenterButton({ position }) {
    const map = useMap();
    if (!position) return null;
    return (
        <button
            type="button"
            onClick={() => map.flyTo(position, 13, { duration: 0.7 })}
            className="absolute top-4 right-4 z-[1000] bg-surface-container-lowest text-on-surface rounded-full shadow-md w-10 h-10 flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container border border-outline-variant"
            title="Recenter on my location"
        >
            <Icon name="my_location" size={20} />
        </button>
    );
}

function FitBounds({ points }) {
    const map = useMap();
    useEffect(() => {
        if (!points.length) return;
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [points, map]);
    return null;
}

export default function VenuesMap({ initialUserPos = null }) {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPos, setUserPos] = useState(initialUserPos);
    const [sportFilter, setSportFilter] = useState('');
    const [searchRadius, setSearchRadius] = useState(25);
    const [error, setError] = useState('');
    const requestedLocationRef = useRef(false);

    // Ask for the user's location on first mount (browser prompt)
    useEffect(() => {
        if (requestedLocationRef.current || initialUserPos) return;
        requestedLocationRef.current = true;
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
            (err) => console.log('Location denied / unavailable:', err?.message),
            { enableHighAccuracy: false, timeout: 8000 }
        );
    }, [initialUserPos]);

    // Fetch venues — either nearby (if we have a location) or all venues with coords
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                let url;
                if (userPos) {
                    const [lat, lng] = userPos;
                    url = `/api/venues/nearby?latitude=${lat}&longitude=${lng}&radius=${searchRadius}&limit=50`;
                    if (sportFilter) url += `&sportType=${sportFilter}`;
                } else {
                    url = '/api/venues/search?limit=50';
                    if (sportFilter) url += `&sportType=${sportFilter}`;
                }
                const res = await fetch(url);
                const data = await res.json();
                if (cancelled) return;
                if (!data.success) {
                    setError(data.message || 'Failed to load venues.');
                    setVenues([]);
                    return;
                }
                const list = data.data?.venues || [];
                // Only keep venues with lat/lng pinned
                setVenues(list.filter((v) => Number.isFinite(v.latitude) && Number.isFinite(v.longitude)));
            } catch (err) {
                console.error('Map fetch error:', err);
                if (!cancelled) setError('Network error while loading venues.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [userPos, sportFilter, searchRadius]);

    const allPoints = useMemo(() => {
        const points = venues.map((v) => [v.latitude, v.longitude]);
        if (userPos) points.push(userPos);
        return points;
    }, [venues, userPos]);

    const centre = userPos || (venues[0] ? [venues[0].latitude, venues[0].longitude] : [20.5937, 78.9629]); // India centroid

    return (
        <div className="relative w-full h-full">
            {/* Filter bar */}
            <div className="absolute top-4 left-4 z-[1000] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md p-3 flex flex-wrap items-center gap-2 max-w-[calc(100%-72px)]">
                <select
                    value={sportFilter}
                    onChange={(e) => setSportFilter(e.target.value)}
                    className="text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-2 py-1.5 focus:ring-2 focus:ring-primary"
                >
                    <option value="">All sports</option>
                    <option value="BADMINTON">🏸 Badminton</option>
                    <option value="TENNIS">🎾 Tennis</option>
                    <option value="BASKETBALL">🏀 Basketball</option>
                    <option value="FOOTBALL">⚽ Football</option>
                    <option value="CRICKET">🏏 Cricket</option>
                    <option value="SWIMMING">🏊 Swimming</option>
                    <option value="TABLE_TENNIS">🏓 Table Tennis</option>
                    <option value="VOLLEYBALL">🏐 Volleyball</option>
                </select>
                {userPos && (
                    <select
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        className="text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-2 py-1.5 focus:ring-2 focus:ring-primary"
                    >
                        <option value={5}>Within 5 km</option>
                        <option value={10}>Within 10 km</option>
                        <option value={25}>Within 25 km</option>
                        <option value={50}>Within 50 km</option>
                    </select>
                )}
                <span className="text-xs font-mono text-on-surface-variant px-2">
                    {loading ? 'Loading…' : `${venues.length} venue${venues.length === 1 ? '' : 's'}`}
                </span>
            </div>

            {error && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-error-container text-on-error-container px-3 py-2 rounded-md text-sm shadow-md">
                    {error}
                </div>
            )}

            <MapContainer
                center={centre}
                zoom={userPos ? 13 : 5}
                scrollWheelZoom
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {userPos && (
                    <Marker position={userPos} icon={userIcon}>
                        <Popup>Your location</Popup>
                    </Marker>
                )}

                {venues.map((v) => {
                    const primarySport = Array.isArray(v.sportTypes) ? v.sportTypes[0] : v.sportType;
                    return (
                        <Marker key={v.id} position={[v.latitude, v.longitude]} icon={venueIcon(primarySport)}>
                            <Popup>
                                <div className="min-w-[200px]">
                                    <h3 className="font-bold text-base mb-1">{v.name}</h3>
                                    {v.city && <p className="text-xs text-gray-600 mb-2">{v.city}</p>}
                                    {v.distanceText && (
                                        <p className="text-xs text-gray-500 mb-2">📍 {v.distanceText}</p>
                                    )}
                                    {Array.isArray(v.sportTypes) && v.sportTypes.length > 0 && (
                                        <p className="text-xs mb-2">
                                            {v.sportTypes.slice(0, 3).join(' • ')}
                                        </p>
                                    )}
                                    {v.priceRange && (
                                        <p className="text-xs font-mono text-green-700 mb-2">
                                            ₹{v.priceRange.min}{v.priceRange.max !== v.priceRange.min ? `–${v.priceRange.max}` : ''}/hr
                                        </p>
                                    )}
                                    <Link
                                        href={`/venues/${v.id}`}
                                        className="inline-block text-xs font-medium text-green-700 hover:underline"
                                    >
                                        View venue →
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                <FitBounds points={allPoints} />
                <RecenterButton position={userPos} />
            </MapContainer>
        </div>
    );
}
