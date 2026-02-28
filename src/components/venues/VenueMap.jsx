'use client';

import { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';

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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Location</h3>
                        <p className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-none">
                            {fullAddress}
                        </p>
                    </div>
                </div>
                <button
                    onClick={openInMaps}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                    <Navigation className="w-4 h-4" />
                    <span className="hidden sm:inline">Get Directions</span>
                </button>
            </div>

            {/* Map Container */}
            {!showMap ? (
                <div className="relative h-64 bg-slate-100">
                    {/* Preview with click-to-load */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                            <MapPin className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-slate-600 font-medium mb-4">Click to load interactive map</p>
                        <button
                            onClick={() => setShowMap(true)}
                            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                        >
                            <MapPin className="w-4 h-4" />
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
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={openInMaps}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                        <Navigation className="w-4 h-4" />
                        Directions
                    </button>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open in Maps
                    </a>
                </div>
                
                {/* Coordinates if available */}
                {latitude && longitude && (
                    <p className="text-xs text-slate-400 text-center mt-3">
                        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                )}
            </div>
        </div>
    );
}

export default VenueMap;
