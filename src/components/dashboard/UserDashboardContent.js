'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard, ActivityFeed, QuickActions, FavoritesSection } from '@/components/dashboard';
import RecommendedForYou from '@/components/dashboard/RecommendedForYou';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * UserDashboardContent Component
 * Main dashboard content with stats, bookings, and activity
 */
export default function UserDashboardContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Transform recentActivity from API format to ActivityFeed format
    const transformActivityData = (recentActivity) => {
        if (!recentActivity) return [];

        const activities = [];

        // Transform bookings
        if (recentActivity.bookings) {
            recentActivity.bookings.forEach(b => {
                let activityType = 'BOOKING_CREATED';
                if (b.status === 'CONFIRMED') activityType = 'BOOKING_CONFIRMED';
                if (b.status === 'CANCELLED') activityType = 'BOOKING_CANCELLED';
                if (b.status === 'COMPLETED') activityType = 'BOOKING_CONFIRMED';

                activities.push({
                    id: `booking-${b.id}`,
                    type: activityType,
                    message: b.description,
                    createdAt: b.date
                });
            });
        }

        // Transform reviews
        if (recentActivity.reviews) {
            recentActivity.reviews.forEach(r => {
                activities.push({
                    id: `review-${r.id}`,
                    type: 'REVIEW_POSTED',
                    message: r.description,
                    createdAt: r.date
                });
            });
        }

        // Sort by date descending
        return activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/dashboard');
            return;
        }

        fetchDashboardData();
    }, [user, authLoading]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view dashboard');
            }

            const res = await fetch('/api/users/dashboard?period=month&includeStats=true&includeUpcoming=true&includeRecent=true', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setDashboardData(data.data.dashboard);
            } else {
                throw new Error(data.message || 'Failed to load dashboard');
            }
        } catch (err) {
            console.error('Fetch dashboard error:', err);
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

    const getSportIcon = (sportType) => {
        const icons = {
            'TENNIS': '🎾',
            'BADMINTON': '🏸',
            'BASKETBALL': '🏀',
            'FOOTBALL': '⚽',
            'TABLE_TENNIS': '🏓',
            'SWIMMING': '🏊',
            'CRICKET': '🏏',
            'VOLLEYBALL': '🏐'
        };
        return icons[sportType] || '🏆';
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-28 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="progress_activity" size={40} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-on-surface-variant">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface pt-28 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-error-container border border-error/20 rounded-[20px] p-8 text-center">
                        <Icon name="error" size={48} className="text-error mx-auto mb-4" />
                        <h2 className="font-display text-xl font-semibold text-on-error-container mb-2">Error loading dashboard</h2>
                        <p className="text-on-error-container mb-4">{error}</p>
                        <Button onClick={handleRefresh}>Try Again</Button>
                    </div>
                </div>
            </div>
        );
    }

    const stats = dashboardData?.stats;
    const upcomingBookings = dashboardData?.upcomingBookings || [];
    const firstName = dashboardData?.user?.name?.split(' ')[0] || 'Player';

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16 page-enter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">

                {/* Welcome Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="avatar w-16 h-16 text-2xl bg-primary-container text-on-primary-container font-display font-semibold shrink-0">
                            {firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="font-display text-4xl md:text-5xl font-semibold text-on-surface tracking-tight">
                                Welcome back, <span className="text-primary italic">{firstName}.</span>
                            </h1>
                            <p className="text-on-surface-variant mt-2 text-base">
                                Ready for your next match?
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="btn btn-outline btn-sm self-start md:self-auto"
                    >
                        <Icon name="refresh" size={16} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </header>

                {/* Quick Actions */}
                <div>
                    <QuickActions />
                </div>

                {/* Bento Grid: Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Stat 1 - Total Bookings */}
                    <div className="card card-hover p-[22px]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                <Icon name="receipt_long" size={20} />
                            </div>
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-2">Total Bookings</p>
                        <p className="font-display text-4xl font-semibold text-on-surface tracking-tight leading-none">{stats?.allTime?.totalBookings || 0}</p>
                        <p className="text-xs text-on-surface-variant mt-2">{stats?.period?.total || 0} this month</p>
                    </div>

                    {/* Stat 2 - Spent */}
                    <div className="card card-hover p-[22px]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                                <Icon name="payments" size={20} />
                            </div>
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-2">Amount Spent</p>
                        <p className="font-display font-mono text-4xl font-semibold text-on-surface tracking-tight leading-none">
                            ₹{(stats?.allTime?.totalSpent || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-2">
                            ₹{(stats?.period?.totalSpent || 0).toLocaleString()} this month
                        </p>
                    </div>

                    {/* Stat 3 - Favorite Sport */}
                    <div className="card card-hover p-[22px]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center">
                                <Icon name="emoji_events" size={20} />
                            </div>
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-2">Favorite Sport</p>
                        <p className="font-display text-2xl font-semibold text-on-surface tracking-tight truncate">
                            {stats?.period?.favoriteSport
                                ? `${getSportIcon(stats.period.favoriteSport)} ${stats.period.favoriteSport.replace(/_/g, ' ')}`
                                : 'None yet'}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-2">Most played</p>
                    </div>

                    {/* Stat 4 - Completion Rate */}
                    <div className="card card-hover p-[22px]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                <Icon name="target" size={20} />
                            </div>
                        </div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-2">Completion Rate</p>
                        <p className="font-display font-mono text-4xl font-semibold text-on-surface tracking-tight leading-none">{stats?.rates?.completionRate || 0}%</p>
                        <p className="text-xs text-on-surface-variant mt-2">Bookings completed</p>
                    </div>
                </section>

                {/* Main Dashboard Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Upcoming & Summary) */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        {/* Upcoming Bookings */}
                        <section className="card p-[22px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                        <Icon name="schedule" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="font-display font-semibold text-xl text-on-surface">Upcoming bookings</h2>
                                        <p className="text-sm text-on-surface-variant">
                                            Your next {upcomingBookings.length > 0 ? upcomingBookings.length : ''} reservations
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard/bookings"
                                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                                >
                                    View all
                                    <Icon name="chevron_right" size={16} />
                                </Link>
                            </div>

                            {upcomingBookings.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingBookings.slice(0, 3).map((booking) => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={{
                                                ...booking,
                                                court: booking.court,
                                                venue: booking.venue
                                            }}
                                            variant="compact"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                                        <Icon name="calendar_today" size={40} className="text-on-surface-variant" />
                                    </div>
                                    <h3 className="font-display text-lg font-semibold text-on-surface mb-2">No upcoming bookings</h3>
                                    <p className="text-on-surface-variant mb-4">Ready to hit the court? Book your next session!</p>
                                    <Link href="/venues" className="btn btn-cta">
                                        <Icon name="auto_awesome" size={16} />
                                        Find a Court
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Monthly Summary */}
                        <section className="card p-[22px] relative overflow-hidden bg-inverse-surface text-inverse-on-surface border-transparent">
                            <div className="absolute -right-4 -top-4 opacity-10">
                                <Icon name="trending_up" className="text-9xl" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Icon name="trending_up" size={20} />
                                    <h3 className="font-display font-semibold text-lg">This month&apos;s summary</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 rounded-xl bg-inverse-on-surface/10">
                                        <p className="font-display font-semibold text-3xl text-primary">{stats?.period?.confirmed || 0}</p>
                                        <p className="text-sm opacity-75 mt-1">Confirmed</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl bg-inverse-on-surface/10">
                                        <p className="font-display font-semibold text-3xl text-tertiary">{stats?.period?.completed || 0}</p>
                                        <p className="text-sm opacity-75 mt-1">Completed</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl bg-inverse-on-surface/10">
                                        <p className="font-display font-semibold text-3xl text-error">{stats?.period?.cancelled || 0}</p>
                                        <p className="text-sm opacity-75 mt-1">Cancelled</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column (Activity & Favorites) */}
                    <div className="flex flex-col gap-8">
                        {/* Recent Activity */}
                        <section className="card p-[22px]">
                            <div className="flex justify-between items-center mb-[18px]">
                                <h3 className="font-display text-base font-semibold text-on-surface">Recent activity</h3>
                                <Icon name="more_horiz" size={18} className="text-on-surface-variant cursor-pointer" />
                            </div>
                            <ActivityFeed
                                activities={transformActivityData(dashboardData?.recentActivity)}
                                loading={false}
                            />
                        </section>

                        {/* Favorites Section */}
                        <FavoritesSection />
                    </div>
                </div>
            </div>

            {/* Personalised recommendations rail */}
            <RecommendedForYou limit={8} />
        </div>
    );
}
