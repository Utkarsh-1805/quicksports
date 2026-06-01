'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function NotFound() {
    return (
        <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col relative overflow-hidden">
            {/* Minimal Header for Brand Context */}
            <header className="absolute top-0 left-0 w-full p-6 z-50 flex justify-center md:justify-start">
                <Link href="/" className="text-2xl font-bold tracking-tighter text-primary inline-flex items-center gap-2">
                    <Icon name="sports_tennis" filled />
                    QuickCourt
                </Link>
            </header>

            {/* Background Atmospheric Lines (Athletic Court Vibe) */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-center">
                <div className="w-[800px] h-[800px] border-[4px] border-outline-variant rounded-full absolute -top-[200px] -right-[200px]"></div>
                <div className="w-full h-px bg-outline-variant absolute top-1/2 left-0 transform -translate-y-1/2"></div>
                <div className="h-full w-px bg-outline-variant absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-6 py-12">
                <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
                    {/* Massive 404 Watermark */}
                    <div className="text-[120px] md:text-[180px] leading-none font-extrabold tracking-tight text-primary-fixed-dim/30 select-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] z-0">
                        404
                    </div>

                    {/* Illustration Container */}
                    <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 mb-8 rounded-full bg-surface-container-high/50 backdrop-blur-sm flex items-center justify-center p-8 shadow-[0_20px_60px_-15px_rgba(0,107,44,0.1)]">
                        <Icon
                            name="sports_basketball"
                            filled
                            className="text-secondary-container drop-shadow-2xl"
                            size={140}
                        />
                    </div>

                    {/* Typography & Messaging */}
                    <div className="relative z-10 space-y-4 mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
                            Court not found
                        </h1>
                        <p className="text-base sm:text-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
                            Looks like this play went out of bounds. The page you&apos;re looking for might have been moved, renamed, or doesn&apos;t exist.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-full font-semibold text-[16px] hover:bg-primary-container hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_24px_-8px_rgba(0,107,44,0.5)]"
                        >
                            <Icon name="home" />
                            Back to Home
                        </Link>
                        <Link
                            href="/venues"
                            className="inline-flex items-center gap-2 px-6 py-4 border border-outline-variant text-on-surface font-medium rounded-full hover:bg-surface-container-high transition-colors"
                        >
                            <Icon name="search" size={20} />
                            Browse Venues
                        </Link>
                    </div>

                    {/* Back link */}
                    <button
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                        className="inline-flex items-center gap-2 mt-8 relative z-10 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                        <Icon name="arrow_back" size={18} />
                        Go back to previous page
                    </button>
                </div>
            </main>
        </div>
    );
}
