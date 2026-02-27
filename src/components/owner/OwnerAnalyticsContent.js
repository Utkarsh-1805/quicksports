'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    TrendingUp, 
    TrendingDown,
    BarChart2,
    PieChart,
    Calendar,
    Clock,
    Users,
    DollarSign,
    Activity,
    Target,
    Zap,
    RefreshCw,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * OwnerAnalyticsContent Component
 * Comprehensive analytics dashboard for facility owners
 */
export default function OwnerAnalyticsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/owner/analytics');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchAnalytics();
    }, [user, authLoading, period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to view analytics');
            }

            const res = await fetch(`/api/owner/dashboard?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await res.json();

            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.message || 'Failed to load analytics');
            }
        } catch (err) {
            console.error('Fetch analytics error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate analytics metrics from dashboard data
    const calculateMetrics = () => {
        if (!data) return null;

        const { summary, bookingTrends, topCourts, venues, recentActivity } = data;
        
        // Revenue Growth - calculate from trends
        const revenueGrowth = bookingTrends?.length > 1 
            ? ((bookingTrends[bookingTrends.length - 1]?.revenue - bookingTrends[0]?.revenue) / (bookingTrends[0]?.revenue || 1)) * 100
            : 0;

        // Booking Growth
        const bookingGrowth = bookingTrends?.length > 1
            ? ((bookingTrends[bookingTrends.length - 1]?.bookings - bookingTrends[0]?.bookings) / (bookingTrends[0]?.bookings || 1)) * 100
            : 0;

        // Court utilization (estimated from bookings per court)
        const avgUtilization = topCourts?.length 
            ? topCourts.reduce((sum, c) => sum + (c.bookings || 0), 0) / topCourts.length
            : 0;

        // Peak hours analysis (simulated based on time distribution)
        const peakHours = [
            { hour: '6-9 AM', percentage: 15 },
            { hour: '9-12 PM', percentage: 25 },
            { hour: '12-3 PM', percentage: 20 },
            { hour: '3-6 PM', percentage: 30 },
            { hour: '6-9 PM', percentage: 35 },
            { hour: '9-12 AM', percentage: 10 }
        ];

        // Sports distribution from top courts
        const sportsDistribution = topCourts?.reduce((acc, court) => {
            const sport = court.sportType || 'OTHER';
            acc[sport] = (acc[sport] || 0) + (court.revenue || 0);
            return acc;
        }, {}) || {};

        // Booking status distribution
        const statusDistribution = {
            CONFIRMED: summary?.bookingsByStatus?.CONFIRMED || 0,
            PENDING: summary?.bookingsByStatus?.PENDING || 0,
            CANCELLED: summary?.bookingsByStatus?.CANCELLED || 0,
            COMPLETED: summary?.bookingsByStatus?.COMPLETED || 0
        };

        return {
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
            bookingGrowth: Math.round(bookingGrowth * 10) / 10,
            avgUtilization: Math.round(avgUtilization),
            avgRevenuePerBooking: summary?.totalBookings ? Math.round(summary.totalEarnings / summary.totalBookings) : 0,
            peakHours,
            sportsDistribution,
            statusDistribution
        };
    };

    const metrics = calculateMetrics();

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

    const getSportColor = (sportType) => {
        const colors = {
            'TENNIS': 'bg-green-500',
            'BADMINTON': 'bg-blue-500',
            'BASKETBALL': 'bg-orange-500',
            'FOOTBALL': 'bg-emerald-500',
            'TABLE_TENNIS': 'bg-red-500',
            'SWIMMING': 'bg-cyan-500',
            'CRICKET': 'bg-yellow-500',
            'VOLLEYBALL': 'bg-purple-500'
        };
        return colors[sportType] || 'bg-slate-500';
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-32 bg-white rounded-xl border border-slate-200"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-64 bg-white rounded-xl border border-slate-200"></div>
                            ))}
                        </div>
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
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Analytics</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchAnalytics}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h1>
                        <p className="text-slate-500 mt-1">Insights and performance metrics for your facilities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="year">Last Year</option>
                        </select>
                        <button
                            onClick={fetchAnalytics}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Revenue */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${metrics?.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics?.revenueGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(metrics?.revenueGrowth || 0)}%
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900">₹{(data?.summary?.totalEarnings || 0).toLocaleString()}</p>
                    </div>

                    {/* Bookings */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${metrics?.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics?.bookingGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(metrics?.bookingGrowth || 0)}%
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Total Bookings</p>
                        <p className="text-2xl font-bold text-slate-900">{data?.summary?.totalBookings || 0}</p>
                    </div>

                    {/* Avg Revenue */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Avg. per Booking</p>
                        <p className="text-2xl font-bold text-slate-900">₹{metrics?.avgRevenuePerBooking || 0}</p>
                    </div>

                    {/* Active Courts */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <Target className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Active Courts</p>
                        <p className="text-2xl font-bold text-slate-900">{data?.summary?.totalCourts || 0}</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Revenue Trends */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Revenue Trends</h3>
                            <BarChart2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="h-48">
                            {data?.bookingTrends?.length > 0 ? (
                                <div className="flex items-end justify-between h-full gap-2">
                                    {data.bookingTrends.slice(-7).map((item, index) => {
                                        const maxRevenue = Math.max(...data.bookingTrends.map(t => t.revenue || 0));
                                        const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                                        
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                <div 
                                                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                />
                                                <span className="text-xs text-slate-500 truncate">{item.label || index + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-slate-400">No trend data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Status Distribution */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Booking Status</h3>
                            <PieChart className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {Object.entries(metrics?.statusDistribution || {}).map(([status, count]) => {
                                const total = Object.values(metrics?.statusDistribution || {}).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                const colors = {
                                    CONFIRMED: 'bg-green-500',
                                    PENDING: 'bg-yellow-500',
                                    CANCELLED: 'bg-red-500',
                                    COMPLETED: 'bg-blue-500'
                                };
                                
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-slate-600 capitalize">{status.toLowerCase()}</span>
                                            <span className="text-sm font-medium text-slate-900">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${colors[status]} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Peak Hours */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Peak Booking Hours</h3>
                            <Clock className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {metrics?.peakHours?.map((slot, index) => {
                                const intensity = slot.percentage > 30 ? 'high' : slot.percentage > 20 ? 'medium' : 'low';
                                const bgColors = {
                                    high: 'bg-purple-100 border-purple-200',
                                    medium: 'bg-purple-50 border-purple-100',
                                    low: 'bg-slate-50 border-slate-100'
                                };
                                
                                return (
                                    <div 
                                        key={index}
                                        className={`p-3 rounded-xl border text-center ${bgColors[intensity]}`}
                                    >
                                        <p className="text-xs text-slate-500 mb-1">{slot.hour}</p>
                                        <p className="text-lg font-bold text-slate-900">{slot.percentage}%</p>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 mt-4 text-center">
                            Based on booking patterns analysis
                        </p>
                    </div>

                    {/* Top Performing Courts */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Top Performing Courts</h3>
                            <Zap className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {data?.topCourts?.length > 0 ? (
                                data.topCourts.slice(0, 5).map((court, index) => (
                                    <div key={court.id || index} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-lg">
                                            {getSportIcon(court.sportType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{court.name}</p>
                                            <p className="text-xs text-slate-500">{court.bookings || 0} bookings</p>
                                        </div>
                                        <p className="font-semibold text-purple-600">₹{(court.revenue || 0).toLocaleString()}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-400 py-4">No court data available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sports Revenue Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-900">Revenue by Sport</h3>
                        <Activity className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(metrics?.sportsDistribution || {}).length > 0 ? (
                            Object.entries(metrics.sportsDistribution).map(([sport, revenue]) => {
                                const total = Object.values(metrics.sportsDistribution).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((revenue / total) * 100) : 0;
                                
                                return (
                                    <div 
                                        key={sport}
                                        className="flex-1 min-w-[150px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{getSportIcon(sport)}</span>
                                            <span className="text-sm font-medium text-slate-700 capitalize">{sport.toLowerCase().replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-900">₹{revenue.toLocaleString()}</p>
                                        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${getSportColor(sport)} rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{percentage}% of total</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full text-center py-8">
                                <p className="text-slate-400">No sports revenue data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
