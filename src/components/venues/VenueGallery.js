'use client';

import { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';

export function VenueGallery({ photos, name }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // If no photos, show a beautiful gradient placeholder
    if (!photos || photos.length === 0) {
        return (
            <div className="w-full h-[40vh] md:h-[60vh] bg-gradient-to-br from-green-50 to-slate-100 rounded-3xl flex flex-col items-center justify-center border border-slate-200 shadow-inner">
                <Camera className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No photos available for {name}</p>
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
            <div className="relative w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden group shadow-lg cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                <img
                    src={photos[currentIndex].url || photos[currentIndex]}
                    alt={`${name} photo ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />

                {/* Navigation Controls (Only show if multiple photos) */}
                {photos.length > 1 && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <button
                            onClick={goPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer z-10"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer z-10"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                            {photos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${currentIndex === idx ? 'bg-white w-8 shadow-md' : 'bg-white/50 hover:bg-white/80'}`}
                                />
                            ))}
                        </div>

                        {/* Counter Badge */}
                        <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white text-sm font-semibold px-4 py-2 rounded-xl">
                            {currentIndex + 1} / {photos.length}
                        </div>
                    </>
                )}
            </div>

            {/* Fullscreen Lightbox */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <img
                        src={photos[currentIndex].url || photos[currentIndex]}
                        alt={`${name} fullscreen`}
                        className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                    />

                    {photos.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                            <button
                                onClick={goPrev}
                                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all transform hover:-translate-x-1"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <span className="text-white/80 font-medium font-mono text-lg">
                                {currentIndex + 1} / {photos.length}
                            </span>
                            <button
                                onClick={goNext}
                                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all transform hover:translate-x-1"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
