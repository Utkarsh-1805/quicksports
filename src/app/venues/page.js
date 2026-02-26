import { Suspense } from 'react';
import VenuesListingClient from '@/components/venues/VenuesListingClient';
import { prisma } from '@/lib/prisma';

export const metadata = {
    title: 'Explore Sports Venues | QuickCourt',
    description: 'Find and book the best sports courts and facilities near you. Filter by sport, price, and amenities.',
};

/**
 * Server Component for the Venues Listing Page
 * Fetches the initial data payload directly ensuring fast SEO indexing.
 * Passes the data down to precisely controlled Client boundaries.
 */
export default async function VenuesPage({ searchParams }) {
    // Await the searchParams object (Next.js 14+ requirement for dynamic pages)
    const resolvedSearchParams = await searchParams;

    // Transform URL search params into API-compatible query string
    const queryString = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
        if (value) queryString.append(key, value);
    });

    // Default to page 1, 9 items per page (fits 3x3 desktop grid nicely)
    if (!queryString.has('page')) queryString.append('page', '1');
    if (!queryString.has('limit')) queryString.append('limit', '9');

    let initialData = {
        venues: [],
        pagination: { page: 1, limit: 9, total: 0, totalPages: 0, hasMore: false },
        filters: {}
    };

    try {
        // ⚠️ Server-side direct API emulation (to avoid absolute URL fetch issues in Next.js Server Components during build)
        // In production, you might directly import the route handler logic, but leveraging standard fetch with full URL is required usually if calling /api.
        // However, since we are purely SSR, we can do relative fetch ONLY if we supply headers or we can hit our own DB.
        // The safest Next.js App Router pattern for same-origin data is executing the DB query directly or calling the backend service layer.

        // For maximum reliability across environments without needing absolute host headers:
        // In a real deployed environment, fetching absolute URL is complex in server components.
        // Here we reconstruct the core search query directly to hydrate the SSR shell.
        // This dramatically improves LCP and SEO over a client-side fetch.

        // 1. Minimum baseline fetch to satisfy initial render block
        const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/venues/search?${queryString.toString()}`, {
            cache: 'no-store' // Always fetch fresh data for dynamic search queries
        });

        if (res.ok) {
            const parsed = await res.json();
            initialData = parsed.data;
        }
    } catch (err) {
        console.error("SSR Venue Fetch Failed. Falling back to empty state.", err);
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen pt-32 pb-20 flex justify-center items-center bg-slate-50">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-green-500 animate-spin"></div>
            </div>
        }>
            <VenuesListingClient
                initialVenues={initialData.venues}
                initialPagination={initialData.pagination}
                initialFilters={initialData.filters}
            />
        </Suspense>
    );
}