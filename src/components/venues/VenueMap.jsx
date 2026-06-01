'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * VenueMap Component
 * Displays venue location on Google Maps with directions
 */
export function VenueMap({
    address,
    city,
    state,
    latitude,
    longitude,
    venueName
}) {
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    // Create full address for Google Maps
    const fullAddress = `${address}, ${city}, ${state}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const encodedName = encodeURIComponent(venueName);

    // Google Maps Embed URL (no API key required for basic embed)
    const mapEmbedUrl = latitude && longitude
        ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=15`
        : `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    // Google Maps directions URL
    const directionsUrl = latitude && longitude
        ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    // Open in Google Maps app/website
    const openInMaps = () => {
        window.open(directionsUrl, '_blank');
    };

    return (
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant">
            {/* Header */}
            <div className="p-4 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                        <Icon name="location_on" filled size={20} className="text-on-primary-container" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-on-surface">Location</h3>
                        <p className="text-on-surface-variant text-sm truncate max-w-[200px] sm:max-w-none">
                            {fullAddress}
                        </p>
                    </div>
                </div>
                <button
                    onClick={openInMaps}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-sm font-medium rounded-full transition-colors shadow-sm"
                >
                    <Icon name="directions" size={16} />
                    <span className="hidden sm:inline">Get Directions</span>
                </button>
            </div>

            {/* Map Container */}
            {!showMap ? (
                <div className="relative h-64 bg-surface-container">
                    {/* Preview with click-to-load */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-lg flex items-center justify-center mb-4">
                            <Icon name="location_on" filled size={36} className="text-primary" />
                        </div>
                        <p className="text-on-surface-variant font-medium mb-4">Click to load interactive map</p>
                        <button
                            onClick={() => setShowMap(true)}
                            className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-medium rounded-full transition-colors flex items-center gap-2"
                        >
                            <Icon name="map" size={16} />
                            Show Map
                        </button>
                    </div>

                    {/* Static map background */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${encodedAddress}&key=)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                </div>
            ) : (
                <div className="relative h-80">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface-container animate-pulse z-10">
                            <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
                        </div>
                    )}
                    <iframe
                        src={`https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        onLoad={() => setLoading(false)}
                        title={`Map of ${venueName}`}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={openInMaps}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container text-on-surface font-medium rounded-full transition-colors"
                    >
                        <Icon name="directions" size={16} />
                        Directions
                    </button>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container text-on-surface font-medium rounded-full transition-colors"
                    >
                        <Icon name="open_in_new" size={16} />
                        Open in Maps
                    </a>
                </div>

                {/* Coordinates if available */}
                {latitude && longitude && (
                    <p className="text-xs text-on-surface-variant text-center mt-3">
                        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                )}
            </div>
        </div>
    );
}

export default VenueMap;
