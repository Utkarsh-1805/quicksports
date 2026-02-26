'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, Loader2, MapPin } from 'lucide-react';
import { VenueFilters } from '@/components/venues/VenueFilters';
import { SearchBar } from '@/components/venues/SearchBar';
import { VenueCard } from '@/components/landing/VenueCard'; // We'll upgrade this soon
import { Button } from '@/components/ui/Button';

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

    // Sync state with URL params
    const createQueryString = useCallback((updates) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                params.delete(key);
            } else if (Array.isArray(value)) {
                if (value.length > 0) {
                    params.set(key, value.join(','));
                } else {
                    params.delete(key);
                }
            } else {
                params.set(key, value);
            }
        });
        return params.toString();
    }, [searchParams]);

    // Handle filter changes from Sidebar
    const handleFilterChange = (newFilters) => {
        setIsLoading(true);
        setFilters(newFilters);
        // Reset to page 1 on filter change
        const queryString = createQueryString({ ...newFilters, page: 1 });
        router.push(`${pathname}?${queryString}`, { scroll: false });
    };

    // Handle SearchBar changes
    const handleSearch = (query, type = 'text') => {
        setIsLoading(true);
        let updates = { page: 1 };

        // Remove old search parameters so we get a clean slate for the new specific search
        updates.search = null;

        if (type === 'city') {
            updates.city = query;
        } else if (type === 'sport') {
            // Note: Our API schema uses sportType
            updates.sportType = query.toUpperCase();
        } else {
            updates.search = query;
        }

        const queryString = createQueryString(updates);
        router.push(`${pathname}?${queryString}`, { scroll: false });
    };

    // Handle sorting
    const handleSortChange = (e) => {
        setIsLoading(true);
        const newSort = e.target.value;
        setSortBy(newSort);
        const queryString = createQueryString({ sortBy: newSort, page: 1 });
        router.push(`${pathname}?${queryString}`, { scroll: false });
    };

    // Load more pagination
    const loadMore = async () => {
        if (!pagination.hasMore || isLoading) return;

        setIsLoading(true);
        const nextPage = pagination.page + 1;
        const queryString = createQueryString({ page: nextPage });

        try {
            const res = await fetch(`/api/venues/search?${queryString}`);
            if (res.ok) {
                const data = await res.json();
                setVenues(prev => [...prev, ...data.data.venues]);
                setPagination(data.data.pagination);
                // Only update URL silently without triggering suspense
                window.history.replaceState(null, '', `?${queryString}`);
            }
        } catch (error) {
            console.error("Failed to load more venues", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update local state when URL params change (e.g. initial load or back button)
    useEffect(() => {
        setIsLoading(false);
        setVenues(initialVenues);
        setPagination(initialPagination);
    }, [initialVenues, initialPagination]);

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="mb-8 relative z-30">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Explore Venues</h1>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                        <div className="w-full md:w-1/2 lg:w-2/3">
                            <SearchBar initialQuery={searchParams.get('search') || searchParams.get('city') || searchParams.get('sportType') || ''} onSearch={handleSearch} />
                        </div>

                        <div className="w-full md:w-auto flex items-center gap-3">
                            <button
                                className="md:hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-2xl hover:bg-slate-200 transition-colors"
                                onClick={() => setIsMobileFiltersOpen(true)}
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                Filters
                            </button>

                            <div className="relative flex-1 md:w-56">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={handleSortChange}
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 pl-11 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium cursor-pointer transition-all hover:border-slate-300"
                                >
                                    <option value="relevance">Recommended</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="rating">Highest Rated</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="newest">Newly Added</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start relative">

                    {/* Desktop Sidebar Filters */}
                    <div className="hidden lg:block w-80 shrink-0 relative z-20">
                        <VenueFilters initialFilters={filters} onFilterChange={handleFilterChange} />
                    </div>

                    {/* Mobile Filters Modal */}
                    {isMobileFiltersOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden flex">
                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                            <div className="relative flex flex-col w-full max-w-sm h-full max-h-screen bg-white shadow-2xl ml-auto animate-in slide-in-from-right duration-300">
                                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                                    <h2 className="text-xl font-bold">Filters</h2>
                                    <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <VenueFilters initialFilters={filters} onFilterChange={handleFilterChange} isMobile={true} />
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <Button fullWidth onClick={() => setIsMobileFiltersOpen(false)}>Show Results</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Grid */}
                    <div className="flex-1 w-full relative z-10">
                        {isLoading && venues.length === 0 ? (
                            // Initial Loading State Grid Skeleton
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-80 bg-slate-200 rounded-3xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : venues.length > 0 ? (
                            <>
                                <div className="mb-4 text-slate-500 font-medium flex items-center justify-between">
                                    <span>Showing <span className="text-slate-900 font-bold">{pagination.total}</span> venues</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                                    {venues.map((venue) => (
                                        <VenueCard key={venue.id} venue={venue} />
                                    ))}
                                </div>

                                {pagination.hasMore && (
                                    <div className="flex justify-center pb-10">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            loading={isLoading}
                                            className="w-full sm:w-auto px-10 border-2"
                                        >
                                            Load More Venues
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Empty State
                            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MapPin className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">No venues found</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8">
                                    We couldn&apos;t find any sports facilities matching your exact filters. Try adjusting your search criteria or removing some filters.
                                </p>
                                <Button onClick={() => handleFilterChange({})}>
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
