'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

// Leaflet doesn't SSR — load the map only in the browser
const VenuesMap = dynamic(() => import('@/components/venues/VenuesMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <div className="text-center">
                <Icon name="map" size={48} className="text-primary mx-auto mb-2 animate-pulse" />
                <p className="text-on-surface-variant">Loading map…</p>
            </div>
        </div>
    ),
});

export default function VenuesMapPage() {
    return (
        <div className="min-h-screen bg-surface pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-1">
                            <Link href="/venues" className="hover:text-primary transition-colors">Venues</Link>
                            <Icon name="chevron_right" size={16} />
                            <span className="text-on-surface">Map View</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
                            Find venues near you
                        </h1>
                        <p className="text-on-surface-variant mt-1 text-sm">
                            Allow location access to see the closest courts. Zoom in for details.
                        </p>
                    </div>
                    <Link
                        href="/venues"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container text-sm font-medium"
                    >
                        <Icon name="view_list" size={16} />
                        List View
                    </Link>
                </div>

                <div className="h-[calc(100vh-200px)] min-h-[500px] rounded-2xl overflow-hidden border border-outline-variant shadow-md">
                    <VenuesMap />
                </div>
            </div>
        </div>
    );
}
