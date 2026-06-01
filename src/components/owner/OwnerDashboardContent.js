'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DollarSign,
    Calendar,
    Building2,
    Star,
    TrendingUp,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    OwnerStatsCard,
    RevenueChart,
    RecentBookingsTable,
    TopCourtsCard,
    OwnerQuickActions,
    VenuePerformanceCard,
    BookingCalendar
} from '@/components/owner';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * OwnerDashboardContent Component
 * Main content area for facility owner dashboard
 */
export default function OwnerDashboardContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('month');
    const [showPeriodMenu, setShowPeriodMenu] = useState(false);

    const periods = [
        { value: 'day', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' }
    ];

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/owner/dashboard');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchDashboardData();
    }, [user, authLoading, period]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to access dashboard');
            }

            const res = await fetch(`/api/owner/dashboard?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setDashboardData(data.data);
            } else {
                throw new Error(data.message || 'Failed to load dashboard');
            }
        } catch (err) {
            console.error('Fetch owner dashboard error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    // Transform recent activity for bookings table
    const getRecentBookings = () => {
        if (!dashboardData?.recentActivity) return [];
        return dashboardData.recentActivity.map(activity => ({
            id: activity.id,
            userName: activity.userName,
            courtName: activity.courtName,
            sportType: activity.sportType,
            status: activity.status,
            totalAmount: activity.amount || 0,
            bookingDate: activity.bookingDate,
            startTime: activity.startTime,
            createdAt: activity.createdAt
        }));
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-10 w-64 bg-surface-container rounded animate-pulse mb-2"></div>
                        <div className="h-5 w-96 bg-surface-container-low rounded animate-pulse"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30">
                                <div className="w-10 h-10 bg-surface-container rounded-lg mb-4 animate-pulse"></div>
                                <div className="h-4 w-24 bg-surface-container rounded animate-pulse mb-2"></div>
                                <div className="h-8 w-32 bg-surface-container rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 h-80">
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        </div>
                        <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 h-80"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center p-4">
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-8 max-w-md w-full text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="error" className="text-error" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-on-surface mb-2">Error Loading Dashboard</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={handleRefresh}>
                        <Icon name="refresh" size={16} className="mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { summary, venues, topCourts, bookingTrends, recentActivity } = dashboardData || {};

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="eyebrow mb-2">Owner Console</p>
                        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">
                            Welcome back, {user?.name?.split(' ')[0] || 'Owner'}
                        </h1>
                        <p className="text-on-surface-variant mt-2 text-base">
                            Here&apos;s what&apos;s happening with your venues today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Period Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                            >
                                {periods.find(p => p.value === period)?.label}
                                <Icon name="expand_more" size={18} />
                            </button>
                            {showPeriodMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-40 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 py-1 z-20">
                                        {periods.map((p) => (
                                            <button
                                                key={p.value}
                                                onClick={() => {
                                                    setPeriod(p.value);
                                                    setShowPeriodMenu(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-container transition-colors ${period === p.value ? 'text-primary font-medium bg-primary-container/10' : 'text-on-surface'}`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
                            aria-label="Refresh"
                        >
                            <Icon name="refresh" size={20} className={refreshing ? 'animate-spin' : ''} />
                        </button>

                        {/* Add Facility CTA */}
                        <button
                            onClick={() => router.push('/owner/facilities/new')}
                            className="btn btn-cta btn-sm hidden md:flex"
                        >
                            <Icon name="add_circle" size={18} />
                            Add Facility
                        </button>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <OwnerStatsCard
                        title="Total Revenue"
                        value={(summary?.totalEarnings || 0).toLocaleString()}
                        icon={DollarSign}
                        currency={true}
                        gradient={true}
                        trendValue="+12.5%"
                        trend="up"
                    />
                    <OwnerStatsCard
                        title="Total Bookings"
                        value={summary?.totalBookings || 0}
                        icon={Calendar}
                        color="tertiary"
                        subtitle={`${summary?.bookingsByStatus?.CONFIRMED || 0} confirmed`}
                        trend="up"
                        trendValue="+8"
                    />
                    <OwnerStatsCard
                        title="Active Courts"
                        value={summary?.totalCourts || 0}
                        icon={Building2}
                        color="secondary"
                        subtitle={`${summary?.activeVenues || 0} venues`}
                    />
                    <OwnerStatsCard
                        title="Average Rating"
                        value={summary?.averageRating?.toFixed(1) || '0.0'}
                        icon={Star}
                        color="secondary"
                        subtitle="From customer reviews"
                        trend={summary?.averageRating >= 4 ? 'up' : summary?.averageRating >= 3 ? 'neutral' : 'down'}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <RevenueChart
                            data={bookingTrends || []}
                            loading={loading}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-1">
                        <OwnerQuickActions />
                    </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Bookings - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <RecentBookingsTable
                            bookings={getRecentBookings()}
                            loading={loading}
                        />
                    </div>

                    {/* Top Courts */}
                    <div className="lg:col-span-1">
                        <TopCourtsCard
                            courts={topCourts || []}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Venue Performance */}
                <VenuePerformanceCard
                    venues={venues || []}
                    loading={loading}
                />

                {/* Booking Calendar */}
                <BookingCalendar
                    bookings={getRecentBookings()}
                    loading={loading}
                />
            </div>
        </div>
    );
}
