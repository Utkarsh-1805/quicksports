'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    DollarSign, 
    Calendar, 
    Building2, 
    Star,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    OwnerStatsCard, 
    RevenueChart, 
    RecentBookingsTable, 
    TopCourtsCard,
    OwnerQuickActions,
    VenuePerformanceCard
} from '@/components/owner';
import { Button } from '@/components/ui/Button';

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
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="h-5 w-96 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4 animate-pulse"></div>
                                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2"></div>
                                <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 h-80">
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-80"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { summary, venues, topCourts, bookingTrends, recentActivity } = dashboardData || {};

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Welcome back, {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Here's what's happening with your venues today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Period Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-purple-300 transition-colors"
                            >
                                {periods.find(p => p.value === period)?.label}
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {showPeriodMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                                        {periods.map((p) => (
                                            <button
                                                key={p.value}
                                                onClick={() => {
                                                    setPeriod(p.value);
                                                    setShowPeriodMenu(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${period === p.value ? 'text-purple-600 font-medium bg-purple-50' : 'text-slate-700'}`}
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
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-purple-600 hover:border-purple-300 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                        subtitle={`${summary?.bookingsByStatus?.CONFIRMED || 0} confirmed`}
                        trend="up"
                        trendValue="+8"
                    />
                    <OwnerStatsCard
                        title="Active Courts"
                        value={summary?.totalCourts || 0}
                        icon={Building2}
                        subtitle={`${summary?.activeVenues || 0} venues`}
                    />
                    <OwnerStatsCard
                        title="Average Rating"
                        value={summary?.averageRating?.toFixed(1) || '0.0'}
                        icon={Star}
                        subtitle="From customer reviews"
                        trend={summary?.averageRating >= 4 ? 'up' : summary?.averageRating >= 3 ? 'neutral' : 'down'}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
            </div>
        </div>
    );
}
