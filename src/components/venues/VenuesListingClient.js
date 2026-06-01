'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { VenueFilters } from '@/components/venues/VenueFilters';
import { SearchBar } from '@/components/venues/SearchBar';
import { VenueCard } from '@/components/landing/VenueCard';

export default function VenuesListingClient({ initialVenues, initialPagination, initialFilters }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [venues, setVenues] = useState(initialVenues);
    const [pagination, setPagination] = useState(initialPagination);
    const [filters, setFilters] = useState(initialFilters);
    const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'relevance');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const createQueryString = useCallback((updates) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                params.delete(key);
            } else if (Array.isArray(value)) {
                if (value.length > 0) params.set(key, value.join(','));
                else params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        return params.toString();
    }, [searchParams]);

    const handleFilterChange = (newFilters) => {
        setIsLoading(true);
        setFilters(newFilters);
        const queryString = createQueryString({ ...newFilters, page: 1 });
        router.push(`${pathname}?${queryString}`, { scroll: false });
    };

    const handleSearch = (query, type = 'text') => {
        setIsLoading(true);
        let updates = { page: 1, search: null };
        if (type === 'city') updates.city = query;
        else if (type === 'sport') updates.sportType = query.toUpperCase();
        else updates.search = query;
        const queryString = createQueryString(updates);
        router.push(`${pathname}?${queryString}`, { scroll: false });
    };

    const handleSortChange = (e) => {
        setIsLoading(true);
        const newSort = e.target.value;
        setSortBy(newSort);
        const queryString = createQueryString({ sortBy: newSort, page: 1 });
        router.push(`${pathname}?${queryString}`, { scroll: false });
    };

    const loadMore = async () => {
        if (!pagination.hasMore || isLoading) return;
        setIsLoading(true);
        const nextPage = pagination.page + 1;
        const queryString = createQueryString({ page: nextPage });
        try {
            const res = await fetch(`/api/venues/search?${queryString}`);
            if (res.ok) {
                const data = await res.json();
                setVenues((prev) => [...prev, ...data.data.venues]);
                setPagination(data.data.pagination);
                window.history.replaceState(null, '', `?${queryString}`);
            }
        } catch (error) {
            console.error('Failed to load more venues', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(false);
        setVenues(initialVenues);
        setPagination(initialPagination);
    }, [initialVenues, initialPagination]);

    return (
        <div className="bg-surface text-on-surface min-h-screen page-enter">
            {/* Header */}
            <header className="container-x pt-12 pb-6">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
                    <Link href="/" className="hover:text-on-surface">Home</Link>
                    <Icon name="chevron_right" size={14} />
                    <span className="text-on-surface">Find a Court</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-on-surface tracking-tight" style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.02em' }}>
                            Explore venues.
                        </h1>
                        <p className="text-on-surface-variant mt-2.5 text-base">
                            <span className="font-mono font-semibold text-on-surface">{pagination?.total ?? venues.length}</span> venues available near you
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/venues/map"
                            className="btn btn-outline btn-sm"
                        >
                            <Icon name="map" size={16} />
                            Map View
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container-x pb-16 flex flex-col lg:flex-row gap-8 w-full">
                {/* Filters sidebar */}
                <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4 relative z-20 self-start sticky top-24">
                    <VenueFilters initialFilters={filters} onFilterChange={handleFilterChange} />
                    <button
                        onClick={() => handleFilterChange({})}
                        className="btn btn-ghost w-full bg-surface-container hover:bg-surface-container-high"
                    >
                        Clear Filters
                    </button>
                </aside>

                {/* Mobile filters modal */}
                {isMobileFiltersOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden flex">
                        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                        <div className="relative flex flex-col w-full max-w-sm h-full bg-surface-container-lowest ml-auto anim-slide-up" style={{ boxShadow: 'var(--shadow-elev)' }}>
                            <div className="p-4 flex items-center justify-between border-b border-outline-variant">
                                <h2 className="font-display text-2xl text-on-surface">Filters</h2>
                                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-surface-container rounded-full">
                                    <Icon name="close" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <VenueFilters initialFilters={filters} onFilterChange={handleFilterChange} isMobile />
                            </div>
                            <div className="p-4 border-t border-outline-variant">
                                <button
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                    className="btn btn-primary w-full"
                                >
                                    Show Results
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right column */}
                <div className="flex-1 flex flex-col gap-5">
                    {/* Search + sort */}
                    <div className="card flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center p-2" style={{ borderRadius: 16 }}>
                        <div className="relative w-full sm:flex-1">
                            <SearchBar
                                initialQuery={searchParams.get('search') || searchParams.get('city') || searchParams.get('sportType') || ''}
                                onSearch={handleSearch}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto pr-1">
                            <button
                                className="lg:hidden btn btn-outline btn-sm"
                                onClick={() => setIsMobileFiltersOpen(true)}
                            >
                                <Icon name="tune" size={16} />
                                Filters
                            </button>
                            <span className="hidden sm:inline font-mono text-xs uppercase tracking-widest text-on-surface-variant whitespace-nowrap pr-1">Sort</span>
                            <select
                                value={sortBy}
                                onChange={handleSortChange}
                                className="bg-surface-container border-none rounded-lg py-2 pl-3 pr-8 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                            >
                                <option value="relevance">Recommended</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                                <option value="popular">Most Popular</option>
                                <option value="newest">Newly Added</option>
                            </select>
                        </div>
                    </div>

                    {/* Results */}
                    {isLoading && venues.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-80 bg-surface-container animate-pulse" style={{ borderRadius: 20 }} />
                            ))}
                        </div>
                    ) : venues.length > 0 ? (
                        <>
                            <div className="text-on-surface-variant text-sm font-medium">
                                Showing <span className="font-mono font-semibold text-on-surface">{pagination.total}</span> venues
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {venues.map((venue) => (
                                    <VenueCard key={venue.id} venue={venue} />
                                ))}
                            </div>
                            {pagination.hasMore && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoading}
                                        className="btn btn-outline disabled:opacity-50"
                                    >
                                        {isLoading ? 'Loading…' : 'Load More Venues'}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card p-16 text-center">
                            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icon name="sentiment_dissatisfied" className="text-on-surface-variant" size={40} />
                            </div>
                            <h3 className="font-display text-2xl text-on-surface mb-2">No venues match those filters.</h3>
                            <p className="text-on-surface-variant max-w-md mx-auto mb-8">
                                Try removing a filter or expanding your price range.
                            </p>
                            <button
                                onClick={() => handleFilterChange({})}
                                className="btn btn-primary"
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
