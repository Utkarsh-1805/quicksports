'use client';

/**
 * Skeleton Component
 * Displays a loading placeholder with animation
 */
export function Skeleton({ className = '', variant = 'rectangular' }) {
    const baseClasses = 'animate-pulse bg-slate-200';
    
    const variants = {
        rectangular: 'rounded-lg',
        circular: 'rounded-full',
        text: 'rounded h-4',
        card: 'rounded-2xl',
    };

    return (
        <div className={`${baseClasses} ${variants[variant]} ${className}`} />
    );
}

/**
 * SkeletonText - Text placeholder
 */
export function SkeletonText({ lines = 1, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {[...Array(lines)].map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className={i === lines - 1 ? 'w-3/4' : 'w-full'}
                />
            ))}
        </div>
    );
}

/**
 * SkeletonCard - Card placeholder
 */
export function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
            <Skeleton className="h-48 w-full" variant="rectangular" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/**
 * SkeletonVenueCard - Venue card placeholder
 */
export function SkeletonVenueCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <Skeleton className="h-48 w-full" variant="rectangular" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/**
 * SkeletonBookingCard - Booking card placeholder
 */
export function SkeletonBookingCard() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <div className="flex gap-4">
                <Skeleton className="w-24 h-24 shrink-0" variant="card" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-3 pt-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
        </div>
    );
}

/**
 * SkeletonTable - Table placeholder
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="flex gap-4">
                    {[...Array(columns)].map((_, i) => (
                        <Skeleton key={i} className="h-5 flex-1" />
                    ))}
                </div>
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-100">
                {[...Array(rows)].map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4">
                        <div className="flex gap-4 items-center">
                            {[...Array(columns)].map((_, colIndex) => (
                                <Skeleton 
                                    key={colIndex} 
                                    className={`h-5 flex-1 ${colIndex === 0 ? 'max-w-[200px]' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * SkeletonDashboardCard - Dashboard stat card placeholder
 */
export function SkeletonDashboardCard() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="w-10 h-10" variant="circular" />
                <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
        </div>
    );
}

/**
 * SkeletonList - List placeholder
 */
export function SkeletonList({ items = 5, showAvatar = true }) {
    return (
        <div className="space-y-4">
            {[...Array(items)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    {showAvatar && <Skeleton className="w-10 h-10 shrink-0" variant="circular" />}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
