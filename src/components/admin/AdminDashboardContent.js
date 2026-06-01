'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

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
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-64 bg-surface-container rounded mb-8"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-36 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 h-80 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            <div className="h-80 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                        <Icon name="error" className="text-on-error-container" size={32} />
                    </div>
                    <h2 className="font-display text-xl text-on-surface mb-2">Error Loading Dashboard</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchDashboard}>
                        <Icon name="refresh" size={16} className="mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { overview, userMetrics, venueMetrics, bookingMetrics, revenueMetrics, recentActivity } = data || {};

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                    <div>
                        <div className="eyebrow mb-3">Admin Console</div>
                        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-on-surface">Platform overview</h1>
                        <p className="text-base text-on-surface-variant mt-2 max-w-2xl">
                            Monitor real-time platform metrics, manage venue approvals, and track high-level system performance.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="pill" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', background: 'color-mix(in oklab, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                            <span className="live-dot"></span> All systems normal
                        </span>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="input font-mono"
                            style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
                        >
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <button
                            onClick={fetchDashboard}
                            className="btn btn-primary btn-sm"
                        >
                            <Icon name="refresh" size={18} />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* KPI Bento Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {/* Total Users */}
                    <div className="card card-hover p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                <Icon name="group" size={20} />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-mono font-semibold ${(overview?.userGrowth || 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                                <Icon name={(overview?.userGrowth || 0) >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {formatPercentage(overview?.userGrowth)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface-variant mb-1">Total Active Users</p>
                            <p className="font-display text-4xl tracking-tight text-on-surface">{overview?.totalUsers?.toLocaleString() || 0}</p>
                        </div>
                    </div>

                    {/* Active Venues */}
                    <div className="card card-hover p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                                <Icon name="storefront" size={20} />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-mono font-semibold ${(overview?.venueGrowth || 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                                <Icon name={(overview?.venueGrowth || 0) >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {formatPercentage(overview?.venueGrowth)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface-variant mb-1">Registered Venues</p>
                            <p className="font-display text-4xl tracking-tight text-on-surface">{overview?.totalVenues?.toLocaleString() || 0}</p>
                        </div>
                    </div>

                    {/* Pending Approvals - Action Required */}
                    <Link href="/admin/approvals" className="card card-hover p-6 flex flex-col justify-between relative overflow-hidden" style={{ borderColor: 'color-mix(in oklab, var(--secondary-container) 40%, var(--outline-variant))' }}>
                        <div className="relative flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--secondary-fixed)', color: '#5c2400' }}>
                                <Icon name="assignment_late" size={20} />
                            </div>
                            <span className="pill secondary" style={{ fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0 }}>
                                Action Required
                            </span>
                        </div>
                        <div className="relative">
                            <p className="text-sm text-on-surface-variant mb-1">Pending Approvals</p>
                            <div className="flex items-end justify-between">
                                <p className="font-display text-4xl tracking-tight text-on-surface">{data?.pendingApprovals || 0}</p>
                                <span className="text-primary text-sm font-medium flex items-center gap-1">
                                    Review Now <Icon name="arrow_forward" size={16} />
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Total Revenue */}
                    <div className="card card-hover p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--secondary-fixed)', color: '#5c2400' }}>
                                <Icon name="payments" size={20} />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-mono font-semibold ${(overview?.revenueGrowth || 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                                <Icon name={(overview?.revenueGrowth || 0) >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {formatPercentage(overview?.revenueGrowth)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface-variant mb-1">Total Revenue</p>
                            <p className="font-display font-mono text-4xl tracking-tight text-on-surface">{formatCurrency(overview?.totalRevenue)}</p>
                        </div>
                    </div>
                </section>

                {/* Quick Action Tiles */}
                <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                    <Link href="/admin/moderation" className="card card-hover p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                            <Icon name="warning" />
                        </div>
                        <div className="flex-1">
                            <p className="font-display text-2xl text-on-surface">{data?.pendingReports || 0}</p>
                            <p className="text-sm text-on-surface-variant">Open Reports</p>
                        </div>
                    </Link>

                    <Link href="/admin/users" className="card card-hover p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                            <Icon name="person_add" />
                        </div>
                        <div className="flex-1">
                            <p className="font-display text-2xl text-on-surface">{data?.newUsersToday || 0}</p>
                            <p className="text-sm text-on-surface-variant">New Users Today</p>
                        </div>
                    </Link>

                    <Link href="/admin/bookings" className="card card-hover p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                            <Icon name="event_available" />
                        </div>
                        <div className="flex-1">
                            <p className="font-display text-2xl text-on-surface">{data?.bookingsToday || 0}</p>
                            <p className="text-sm text-on-surface-variant">Bookings Today</p>
                        </div>
                    </Link>
                </section>

                {/* Charts & Activity Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
                    {/* Platform Growth Chart - 2 cols */}
                    <div className="lg:col-span-2 card p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display text-2xl text-on-surface">Platform Growth</h3>
                            <Icon name="bar_chart" className="text-on-surface-variant" />
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            {revenueMetrics?.trend?.length > 0 ? (
                                <div className="flex items-end justify-between h-full gap-2 border-b border-l border-outline-variant/40 pb-2 pl-2">
                                    {revenueMetrics.trend.slice(-7).map((item, index) => {
                                        const maxRevenue = Math.max(...revenueMetrics.trend.map(t => t.revenue || 0));
                                        const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                                        const isLatest = index === Math.min(revenueMetrics.trend.length, 7) - 1;

                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                                <div className="relative w-full flex-1 flex items-end">
                                                    <div
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${isLatest ? 'bg-primary shadow-[0_-4px_12px_rgba(0,107,44,0.2)]' : 'bg-primary-container/40 hover:bg-primary-container/60'}`}
                                                        style={{ height: `${Math.max(height, 5)}%` }}
                                                        title={`₹${item.revenue?.toLocaleString() || 0}`}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono text-on-surface-variant truncate">{item.label || index + 1}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center min-h-[300px]">
                                    <p className="text-on-surface-variant">No trend data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div className="card p-6 flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display text-2xl text-on-surface">Live Activity</h3>
                            <button
                                onClick={fetchDashboard}
                                className="text-primary hover:text-primary-container transition-colors"
                            >
                                <Icon name="refresh" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {recentActivity?.length > 0 ? (
                                recentActivity.slice(0, 10).map((activity, index) => (
                                    <div key={index} className="flex gap-4 items-start relative group">
                                        <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-outline-variant/30 group-last:hidden"></div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-surface-container-lowest ${
                                            activity.type === 'booking' ? 'bg-primary-container/20 text-primary' :
                                            activity.type === 'user' ? 'bg-secondary-container text-on-secondary-container' :
                                            activity.type === 'venue' ? 'bg-tertiary-container/20 text-tertiary' :
                                            'bg-surface-container-highest text-on-surface-variant'
                                        }`}>
                                            <Icon
                                                name={
                                                    activity.type === 'booking' ? 'event_available' :
                                                    activity.type === 'user' ? 'person_add' :
                                                    activity.type === 'venue' ? 'verified' :
                                                    'info'
                                                }
                                                size={16}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-on-surface truncate">{activity.title}</p>
                                            <p className="text-sm text-on-surface-variant">{activity.description}</p>
                                            <p className="text-xs font-mono text-outline mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-on-surface-variant">No recent activity</p>
                                </div>
                            )}
                        </div>
                        <Link href="/admin/bookings" className="block w-full mt-4 py-2 text-center text-primary text-sm font-bold hover:bg-surface-container rounded-lg transition-colors">
                            View All Activity
                        </Link>
                    </div>
                </div>

                {/* User Distribution */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-2xl text-on-surface">User Distribution</h3>
                        <Icon name="pie_chart" className="text-on-surface-variant" />
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Regular Users', value: userMetrics?.byRole?.USER || 0, color: 'bg-primary' },
                            { label: 'Facility Owners', value: userMetrics?.byRole?.FACILITY_OWNER || 0, color: 'bg-secondary-container' },
                            { label: 'Admins', value: userMetrics?.byRole?.ADMIN || 0, color: 'bg-tertiary' }
                        ].map(item => {
                            const total = (userMetrics?.byRole?.USER || 0) + (userMetrics?.byRole?.FACILITY_OWNER || 0) + (userMetrics?.byRole?.ADMIN || 0);
                            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-on-surface">{item.label}</span>
                                        <span className="text-sm font-mono text-on-surface-variant">{item.value} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
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
        </div>
    );
}
