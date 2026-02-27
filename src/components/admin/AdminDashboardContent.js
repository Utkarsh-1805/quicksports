'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Users, 
    Building2, 
    Calendar, 
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity,
    BarChart3,
    PieChart,
    RefreshCw,
    AlertCircle,
    ArrowRight,
    Shield,
    FileText,
    UserCheck,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

/**
 * AdminDashboardContent Component
 * Main admin dashboard with platform overview
 */
export default function AdminDashboardContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            router.push('/auth/login?redirect=/admin');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchDashboard();
    }, [user, authLoading, period]);

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to access admin panel');
            }

            const res = await fetch(`/api/admin/analytics?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await res.json();

            if (result.success) {
                // Map API response to component expected structure
                const analytics = result.data.analytics || result.data;
                const overview = analytics.overview || {};
                setData({
                    overview: overview,
                    userMetrics: analytics.users || {},
                    venueMetrics: analytics.venues || {},
                    bookingMetrics: analytics.bookings || {},
                    revenueMetrics: analytics.revenue || {},
                    pendingApprovals: overview.pendingApprovals || 0,
                    pendingReports: overview.pendingReports || 0,
                    newUsersToday: overview.newUsersToday || 0,
                    bookingsToday: overview.bookingsToday || 0,
                    recentActivity: analytics.recentActivity || []
                });
            } else {
                throw new Error(result.message || result.error || 'Failed to load analytics');
            }
        } catch (err) {
            console.error('Fetch admin analytics error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatPercentage = (value) => {
        if (!value && value !== 0) return '0%';
        const formatted = Math.round(value * 10) / 10;
        return `${formatted >= 0 ? '+' : ''}${formatted}%`;
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toLocaleString()}`;
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
                            {[1, 2].map((i) => (
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
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchDashboard}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { overview, userMetrics, venueMetrics, bookingMetrics, revenueMetrics, recentActivity } = data || {};

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="text-slate-500 mt-1">Platform overview and analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        >
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <button
                            onClick={fetchDashboard}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Total Users */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${(overview?.userGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(overview?.userGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatPercentage(overview?.userGrowth)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-slate-900">{overview?.totalUsers?.toLocaleString() || 0}</p>
                    </div>

                    {/* Active Venues */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${(overview?.venueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(overview?.venueGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatPercentage(overview?.venueGrowth)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Active Venues</p>
                        <p className="text-2xl font-bold text-slate-900">{overview?.totalVenues?.toLocaleString() || 0}</p>
                    </div>

                    {/* Total Bookings */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${(overview?.bookingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(overview?.bookingGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatPercentage(overview?.bookingGrowth)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Total Bookings</p>
                        <p className="text-2xl font-bold text-slate-900">{overview?.totalBookings?.toLocaleString() || 0}</p>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${(overview?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(overview?.revenueGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {formatPercentage(overview?.revenueGrowth)}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(overview?.totalRevenue)}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Link href="/admin/approvals" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-6 h-6" />
                            <span className="text-2xl font-bold">{data?.pendingApprovals || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-white/90">Pending Approvals</p>
                    </Link>

                    <Link href="/admin/moderation" className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-6 h-6" />
                            <span className="text-2xl font-bold">{data?.pendingReports || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-white/90">Open Reports</p>
                    </Link>

                    <Link href="/admin/users" className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <UserCheck className="w-6 h-6" />
                            <span className="text-2xl font-bold">{data?.newUsersToday || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-white/90">New Users Today</p>
                    </Link>

                    <Link href="/admin/revenue" className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <Activity className="w-6 h-6" />
                            <span className="text-2xl font-bold">{data?.bookingsToday || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-white/90">Bookings Today</p>
                    </Link>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Trend */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="h-48">
                            {revenueMetrics?.trend?.length > 0 ? (
                                <div className="flex items-end justify-between h-full gap-2">
                                    {revenueMetrics.trend.slice(-7).map((item, index) => {
                                        const maxRevenue = Math.max(...revenueMetrics.trend.map(t => t.revenue || 0));
                                        const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                                        
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                <div 
                                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                    title={`₹${item.revenue?.toLocaleString() || 0}`}
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

                    {/* User Distribution */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">User Distribution</h3>
                            <PieChart className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Regular Users', value: userMetrics?.byRole?.USER || 0, color: 'bg-blue-500' },
                                { label: 'Facility Owners', value: userMetrics?.byRole?.FACILITY_OWNER || 0, color: 'bg-purple-500' },
                                { label: 'Admins', value: userMetrics?.byRole?.ADMIN || 0, color: 'bg-orange-500' }
                            ].map(item => {
                                const total = (userMetrics?.byRole?.USER || 0) + (userMetrics?.byRole?.FACILITY_OWNER || 0) + (userMetrics?.byRole?.ADMIN || 0);
                                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                
                                return (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-slate-600">{item.label}</span>
                                            <span className="text-sm font-medium text-slate-900">{item.value} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
                        <Link href="/admin/bookings" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    
                    {recentActivity?.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.slice(0, 10).map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        activity.type === 'booking' ? 'bg-green-50 text-green-600' :
                                        activity.type === 'user' ? 'bg-blue-50 text-blue-600' :
                                        activity.type === 'venue' ? 'bg-purple-50 text-purple-600' :
                                        'bg-slate-50 text-slate-600'
                                    }`}>
                                        {activity.type === 'booking' && <Calendar className="w-5 h-5" />}
                                        {activity.type === 'user' && <Users className="w-5 h-5" />}
                                        {activity.type === 'venue' && <Building2 className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{activity.title}</p>
                                        <p className="text-sm text-slate-500">{activity.description}</p>
                                        <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-400">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
