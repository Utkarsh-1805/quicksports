'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Calendar, 
    CreditCard, 
    Trophy,
    Clock,
    ChevronRight,
    Loader2,
    AlertCircle,
    RefreshCw,
    TrendingUp,
    Wallet,
    Target,
    Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard, BookingCard, ActivityFeed, QuickActions, FavoritesSection } from '@/components/dashboard';
import { Button } from '@/components/ui/Button';

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
            <div className="min-h-screen bg-slate-50 pt-28 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 pt-28 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={handleRefresh}>Try Again</Button>
                    </div>
                </div>
            </div>
        );
    }

    const stats = dashboardData?.stats;
    const upcomingBookings = dashboardData?.upcomingBookings || [];

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                            Welcome back, {dashboardData?.user?.name?.split(' ')[0] || 'Player'}! 👋
                        </h1>
                        <p className="text-slate-500">
                            Here's what's happening with your courts today
                        </p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <QuickActions />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        title="Total Bookings"
                        value={stats?.allTime?.totalBookings || 0}
                        icon={Calendar}
                        subtitle={`${stats?.period?.total || 0} this month`}
                        trend={stats?.period?.total > 0 ? 'up' : 'neutral'}
                    />
                    <StatsCard
                        title="Amount Spent"
                        value={`₹${(stats?.allTime?.totalSpent || 0).toLocaleString()}`}
                        icon={Wallet}
                        subtitle={`₹${(stats?.period?.totalSpent || 0).toLocaleString()} this month`}
                        gradient={true}
                    />
                    <StatsCard
                        title="Favorite Sport"
                        value={stats?.period?.favoriteSport ? `${getSportIcon(stats.period.favoriteSport)} ${stats.period.favoriteSport.replace(/_/g, ' ')}` : 'None yet'}
                        icon={Trophy}
                        subtitle="Most played"
                    />
                    <StatsCard
                        title="Completion Rate"
                        value={`${stats?.rates?.completionRate || 0}%`}
                        icon={Target}
                        subtitle="Bookings completed"
                        trend={stats?.rates?.completionRate >= 80 ? 'up' : stats?.rates?.completionRate >= 50 ? 'neutral' : 'down'}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Upcoming Bookings - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg text-slate-900">Upcoming Bookings</h2>
                                        <p className="text-sm text-slate-500">Your next {upcomingBookings.length > 0 ? upcomingBookings.length : ''} reservations</p>
                                    </div>
                                </div>
                                <Link 
                                    href="/dashboard/bookings"
                                    className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
                                >
                                    View All
                                    <ChevronRight className="w-4 h-4" />
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
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Upcoming Bookings</h3>
                                    <p className="text-slate-500 mb-4">Ready to hit the court? Book your next session!</p>
                                    <Link href="/venues">
                                        <Button>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Find a Court
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Monthly Summary */}
                        <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                                <h3 className="font-bold text-lg">This Month's Summary</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-white/10 rounded-xl">
                                    <p className="text-2xl font-bold text-green-400">{stats?.period?.confirmed || 0}</p>
                                    <p className="text-sm text-slate-300">Confirmed</p>
                                </div>
                                <div className="text-center p-4 bg-white/10 rounded-xl">
                                    <p className="text-2xl font-bold text-blue-400">{stats?.period?.completed || 0}</p>
                                    <p className="text-sm text-slate-300">Completed</p>
                                </div>
                                <div className="text-center p-4 bg-white/10 rounded-xl">
                                    <p className="text-2xl font-bold text-red-400">{stats?.period?.cancelled || 0}</p>
                                    <p className="text-sm text-slate-300">Cancelled</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity - Takes 1 column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-lg text-slate-900">Recent Activity</h2>
                            </div>
                            <ActivityFeed 
                                activities={transformActivityData(dashboardData?.recentActivity)} 
                                loading={false}
                            />
                        </div>
                        
                        {/* Favorites Section */}
                        <FavoritesSection />
                    </div>
                </div>
            </div>
        </div>
    );
}
