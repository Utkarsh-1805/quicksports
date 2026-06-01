'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export function VenueGallery({ photos, name }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // If no photos, show a beautiful placeholder
    if (!photos || photos.length === 0) {
        return (
            <div className="court-tile w-full h-[40vh] md:h-[60vh] rounded-[20px] flex flex-col items-center justify-center border border-outline-variant">
                <Icon name="photo_camera" size={64} className="text-on-surface-variant mb-4" />
                <p className="text-on-surface-variant font-medium">No photos available for {name}</p>
            </div>
        );
    }

    const goNext = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    const goPrev = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    return (
        <>
            <div className="relative w-full h-[40vh] md:h-[60vh] rounded-[20px] overflow-hidden group cursor-zoom-in bg-surface-container-high" style={{ boxShadow: 'var(--shadow-card)' }} onClick={() => setIsLightboxOpen(true)}>
                <img
                    src={photos[currentIndex].url || photos[currentIndex]}
                    alt={`${name} photo ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />

                {/* Navigation Controls (Only show if multiple photos) */}
                {photos.length > 1 && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <button
                            onClick={goPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-surface-container-lowest/90 backdrop-blur-sm hover:bg-surface-container-lowest rounded-full flex items-center justify-center text-on-surface transition-all opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer z-10 shadow-sm"
                        >
                            <Icon name="chevron_left" size={24} />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-surface-container-lowest/90 backdrop-blur-sm hover:bg-surface-container-lowest rounded-full flex items-center justify-center text-on-surface transition-all opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer z-10 shadow-sm"
                        >
                            <Icon name="chevron_right" size={24} />
                        </button>

                        {/* "View all photos" pill */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                            className="absolute bottom-6 right-6 inline-flex items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface rounded-xl px-4 py-2 text-sm font-semibold hover:bg-surface-container-lowest transition-colors z-10"
                            style={{ boxShadow: 'var(--shadow-card)' }}
                        >
                            <Icon name="photo_library" size={16} />
                            View all photos
                        </button>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                            {photos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                    className={`h-2 rounded-full transition-all ${currentIndex === idx ? 'bg-surface-container-lowest w-8' : 'bg-surface-container-lowest/50 hover:bg-surface-container-lowest/80 w-2'}`}
                                />
                            ))}
                        </div>

                        {/* Counter Badge */}
                        <div className="absolute top-6 right-6 bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface font-mono text-sm font-semibold px-3 py-1.5 rounded-full">
                            {currentIndex + 1} / {photos.length}
                        </div>
                    </>
                )}
            </div>

            {/* Fullscreen Lightbox */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-on-surface/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 w-12 h-12 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-full flex items-center justify-center transition-colors shadow-sm"
                    >
                        <Icon name="close" size={24} />
                    </button>

                    <div className="bg-surface-container-lowest rounded-xl p-2 shadow-2xl">
                        <img
                            src={photos[currentIndex].url || photos[currentIndex]}
                            alt={`${name} fullscreen`}
                            className="max-w-[95vw] max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>

                    {photos.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                            <button
                                onClick={goPrev}
                                className="w-14 h-14 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-full flex items-center justify-center transition-all transform hover:-translate-x-1 shadow-sm"
                            >
                                <Icon name="chevron_left" size={32} />
                            </button>
                            <span className="text-on-primary font-medium font-mono text-lg">
                                {currentIndex + 1} / {photos.length}
                            </span>
                            <button
                                onClick={goNext}
                                className="w-14 h-14 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface rounded-full flex items-center justify-center transition-all transform hover:translate-x-1 shadow-sm"
                            >
                                <Icon name="chevron_right" size={32} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
