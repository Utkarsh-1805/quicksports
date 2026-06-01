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
import { Icon } from '@/components/ui/Icon';

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

    const getSportColor = (sportType, idx = 0) => {
        const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container'];
        return colors[idx % colors.length];
    };

    // Heatmap helper - returns an inline background based on intensity 0-3
    // Deeper primary green = more bookings.
    const heatStyle = (intensity) => {
        if (intensity >= 3) return { background: 'var(--primary)' };
        if (intensity >= 2) return { background: 'color-mix(in oklab, var(--primary) 66%, var(--surface-container))' };
        if (intensity >= 1) return { background: 'color-mix(in oklab, var(--primary) 33%, var(--surface-container))' };
        return { background: 'var(--surface-container)' };
    };

    // Real peak-hours heatmap from API; falls back to deterministic mock if API hasn't returned the field yet.
    // API shape: peakHoursByDay[dayOfWeek 0–6][hour 0–23] = booking count
    const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmapHours = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'];
    const dowIndex = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun map to JS getUTCDay() values
    const hourIndex = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

    const realHeatmap = Array.isArray(data?.peakHoursByDay) && data.peakHoursByDay.length === 7
        ? data.peakHoursByDay
        : null;

    // Bucket the real counts into 4 intensity levels (0..3) for the colour scale.
    const flatCounts = realHeatmap
        ? heatmapDays.flatMap((_, di) => heatmapHours.map((_, hi) => realHeatmap[dowIndex[di]][hourIndex[hi]] || 0))
        : [];
    const maxCount = flatCounts.length ? Math.max(...flatCounts) : 0;

    const heatmapData = realHeatmap
        ? heatmapDays.map((_, di) =>
            heatmapHours.map((_, hi) => {
                const count = realHeatmap[dowIndex[di]][hourIndex[hi]] || 0;
                if (maxCount === 0) return 0;
                if (count === 0) return 0;
                if (count / maxCount > 0.66) return 3;
                if (count / maxCount > 0.33) return 2;
                return 1;
            }))
        : heatmapDays.map((d, di) =>
            heatmapHours.map((h, hi) => {
                // Deterministic fallback when no data yet
                const evening = hi >= 8 && hi <= 12 ? 2 : hi >= 5 && hi <= 7 ? 1 : 0;
                const weekend = di >= 5 ? 1 : 0;
                const noise = (di * 7 + hi * 3) % 4 === 0 ? 1 : 0;
                return Math.min(3, evening + weekend + noise - (hi <= 1 ? 1 : 0));
            })
        );

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-48 bg-surface-container rounded mb-6"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 h-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            <div className="lg:col-span-4 h-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            <div className="lg:col-span-12 h-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
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
                        <Icon name="error" size={32} className="text-error" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">Error Loading Analytics</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="btn btn-cta"
                    >
                        <Icon name="refresh" size={18} />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Sports donut math
    const sportsEntries = Object.entries(metrics?.sportsDistribution || {});
    const sportsTotal = sportsEntries.reduce((sum, [, v]) => sum + v, 0);
    const donutColors = ['stroke-primary', 'stroke-secondary', 'stroke-tertiary', 'stroke-primary-container', 'stroke-secondary-container'];
    const dotColors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary-container', 'bg-secondary-container'];

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="eyebrow mb-2">Performance Insights</p>
                        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-on-surface tracking-tight">Owner Analytics</h1>
                    </div>

                    {/* Date Range Selector (segmented) */}
                    <div className="flex items-center bg-surface-container rounded-xl p-1">
                        <button
                            onClick={() => setPeriod('week')}
                            className={`px-4 py-2 text-sm font-mono font-medium rounded-lg transition-colors ${
                                period === 'week' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface hover:bg-surface-container-high'
                            }`}
                        >
                            7D
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={`px-4 py-2 text-sm font-mono font-medium rounded-lg transition-colors ${
                                period === 'month' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface hover:bg-surface-container-high'
                            }`}
                        >
                            30D
                        </button>
                        <button
                            onClick={() => setPeriod('year')}
                            className={`px-4 py-2 text-sm font-mono font-medium rounded-lg transition-colors ${
                                period === 'year' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface hover:bg-surface-container-high'
                            }`}
                        >
                            1Y
                        </button>
                        <div className="w-px h-5 bg-outline-variant mx-1" />
                        <button
                            onClick={fetchAnalytics}
                            className="px-3 py-2 text-sm font-medium text-on-surface flex items-center gap-2 hover:bg-surface-container-high rounded-md transition-colors"
                        >
                            <Icon name="refresh" size={18} />
                        </button>
                    </div>
                </div>

                {/* KPI Ribbon */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* KPI 1: Revenue */}
                    <div className="card p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                <Icon name="payments" size={20} />
                            </div>
                            <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                                metrics?.revenueGrowth >= 0 ? 'text-primary' : 'text-error'
                            }`}>
                                <Icon name={metrics?.revenueGrowth >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {metrics?.revenueGrowth >= 0 ? '+' : ''}{metrics?.revenueGrowth || 0}%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface-variant mb-1">Total Revenue</p>
                            <p className="font-display font-mono font-semibold text-4xl text-on-surface tracking-tight">₹{(data?.summary?.totalEarnings || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* KPI 2: Bookings */}
                    <div className="card p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center">
                                <Icon name="sports_tennis" size={20} />
                            </div>
                            <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                                metrics?.bookingGrowth >= 0 ? 'text-primary' : 'text-error'
                            }`}>
                                <Icon name={metrics?.bookingGrowth >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {metrics?.bookingGrowth >= 0 ? '+' : ''}{metrics?.bookingGrowth || 0}%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface-variant mb-1">Total Bookings</p>
                            <p className="font-display font-mono font-semibold text-4xl text-on-surface tracking-tight">
                                {data?.summary?.totalBookings || 0}
                                <span className="text-xl font-normal text-on-surface-variant ml-1">bookings</span>
                            </p>
                        </div>
                    </div>

                    {/* KPI 3: Avg per booking */}
                    <div className="card p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                                <Icon name="group_add" size={20} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-on-surface-variant font-mono text-xs font-semibold">
                                <Icon name="trending_flat" size={14} />
                                0.0%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface-variant mb-1">Avg. per Booking</p>
                            <p className="font-display font-mono font-semibold text-4xl text-on-surface tracking-tight">
                                ₹{metrics?.avgRevenuePerBooking || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Secondary KPI: Active Courts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-container flex items-center justify-center">
                                <Icon name="track_changes" size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.08em] font-mono">Active Courts</p>
                                <p className="font-mono text-2xl font-semibold text-on-surface">{data?.summary?.totalCourts || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                <Icon name="domain" size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.08em] font-mono">Active Venues</p>
                                <p className="font-mono text-2xl font-semibold text-on-surface">{data?.summary?.totalVenues || data?.venues?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                                <Icon name="bolt" size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] text-on-surface-variant uppercase tracking-[0.08em] font-mono">Avg Utilization</p>
                                <p className="font-mono text-2xl font-semibold text-on-surface">{metrics?.avgUtilization || 0}<span className="text-base text-on-surface-variant ml-1">/ court</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                    {/* Bookings Volume - Line/Area chart */}
                    <div className="lg:col-span-8 card p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-display text-lg font-semibold text-on-surface">Bookings Volume</h3>
                                <p className="text-sm text-on-surface-variant mt-1">Booking activity over time</p>
                            </div>
                            <button className="p-1 text-on-surface-variant hover:text-on-surface">
                                <Icon name="more_vert" size={20} />
                            </button>
                        </div>
                        {data?.bookingTrends?.length > 0 ? (
                            <div className="flex-1 relative w-full h-64">
                                <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="primaryAreaGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const trends = data.bookingTrends.slice(-14);
                                        const max = Math.max(...trends.map(t => t.bookings || 0), 1);
                                        const points = trends.map((t, i) => {
                                            const x = trends.length > 1 ? (i / (trends.length - 1)) * 100 : 50;
                                            const y = 100 - ((t.bookings || 0) / max) * 90 - 5;
                                            return `${x},${y}`;
                                        });
                                        const linePath = `M${points.join(' L')}`;
                                        const areaPath = `${linePath} L100,100 L0,100 Z`;
                                        return (
                                            <>
                                                <path d={areaPath} fill="url(#primaryAreaGrad)" />
                                                <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                                                {points.map((p, i) => {
                                                    const [x, y] = p.split(',');
                                                    return <circle key={i} cx={x} cy={y} r="1.5" fill="currentColor" vectorEffect="non-scaling-stroke" />;
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center h-64">
                                <p className="text-on-surface-variant">No trend data available</p>
                            </div>
                        )}
                    </div>

                    {/* Sport Breakdown Donut */}
                    <div className="lg:col-span-4 card p-6 flex flex-col">
                        <h3 className="font-display text-lg font-semibold text-on-surface mb-1">Sport Breakdown</h3>
                        <p className="text-sm text-on-surface-variant mb-6">Revenue share by activity type</p>
                        {sportsEntries.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-on-surface-variant text-sm">No sports data</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="relative w-48 h-48">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" className="stroke-surface-container" strokeWidth="16" />
                                            {(() => {
                                                let cumulative = 0;
                                                const C = 2 * Math.PI * 40;
                                                return sportsEntries.slice(0, 5).map(([sport, val], idx) => {
                                                    const pct = sportsTotal > 0 ? val / sportsTotal : 0;
                                                    const dash = pct * C;
                                                    const offset = -cumulative * C;
                                                    cumulative += pct;
                                                    return (
                                                        <circle
                                                            key={sport}
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            fill="transparent"
                                                            className={donutColors[idx % donutColors.length]}
                                                            strokeWidth="16"
                                                            strokeDasharray={`${dash} ${C - dash}`}
                                                            strokeDashoffset={offset}
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="font-display text-2xl font-bold text-on-surface">
                                                {sportsEntries[0] && sportsTotal > 0 ? Math.round((sportsEntries[0][1] / sportsTotal) * 100) : 0}%
                                            </span>
                                            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                                                {sportsEntries[0]?.[0]?.toLowerCase().replace('_', ' ') || ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full mt-6 flex flex-col gap-2 font-mono text-sm">
                                    {sportsEntries.slice(0, 5).map(([sport, val], idx) => {
                                        const pct = sportsTotal > 0 ? Math.round((val / sportsTotal) * 100) : 0;
                                        return (
                                            <div key={sport} className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 capitalize text-on-surface">
                                                    <div className={`w-3 h-3 rounded-sm ${dotColors[idx % dotColors.length]}`} />
                                                    {sport.toLowerCase().replace('_', ' ')}
                                                </div>
                                                <span className="font-bold text-on-surface">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Peak Utilization Heatmap (24h × 7d) */}
                    <div className="lg:col-span-12 card p-6 overflow-x-auto">
                        <div className="flex justify-between items-center mb-6 min-w-[600px]">
                            <div>
                                <h3 className="font-display text-lg font-semibold text-on-surface">Peak Utilization Hours</h3>
                                <p className="text-sm text-on-surface-variant">Average court occupancy across the week</p>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                                <span>Low</span>
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded-sm" style={heatStyle(0)} />
                                    <div className="w-4 h-4 rounded-sm" style={heatStyle(1)} />
                                    <div className="w-4 h-4 rounded-sm" style={heatStyle(2)} />
                                    <div className="w-4 h-4 rounded-sm" style={heatStyle(3)} />
                                </div>
                                <span>High</span>
                            </div>
                        </div>
                        <div className="min-w-[700px]">
                            {/* X axis */}
                            <div className="grid grid-cols-[60px_repeat(14,1fr)] gap-1 mb-2">
                                <div></div>
                                {heatmapHours.map((h) => (
                                    <div key={h} className="text-center font-mono text-[10px] text-on-surface-variant">{h}</div>
                                ))}
                            </div>
                            {/* Days */}
                            <div className="flex flex-col gap-1">
                                {heatmapDays.map((day, di) => (
                                    <div key={day} className="grid grid-cols-[60px_repeat(14,1fr)] gap-1 items-center">
                                        <div className="font-mono text-xs text-on-surface-variant uppercase tracking-[0.08em]">{day}</div>
                                        {heatmapHours.map((h, hi) => (
                                            <div
                                                key={`${day}-${h}`}
                                                className="h-8 rounded-sm hover:ring-1 hover:ring-outline transition-all cursor-pointer"
                                                style={heatStyle(heatmapData[di][hi])}
                                                title={`${day} ${h}`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom row: Booking status + Top courts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Booking Status Distribution */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-lg font-semibold text-on-surface">Booking Status</h3>
                            <Icon name="pie_chart" size={20} className="text-on-surface-variant" />
                        </div>
                        <div className="space-y-4">
                            {Object.entries(metrics?.statusDistribution || {}).map(([status, count]) => {
                                const total = Object.values(metrics?.statusDistribution || {}).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                                const colors = {
                                    CONFIRMED: 'bg-primary',
                                    PENDING: 'bg-secondary-container',
                                    CANCELLED: 'bg-error',
                                    COMPLETED: 'bg-tertiary'
                                };

                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm text-on-surface capitalize">{status.toLowerCase()}</span>
                                            <span className="font-mono text-sm font-bold text-on-surface">{count} <span className="text-on-surface-variant">({percentage}%)</span></span>
                                        </div>
                                        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
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

                    {/* Top Performing Courts */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-lg font-semibold text-on-surface">Top Performing Courts</h3>
                            <Icon name="bolt" size={20} className="text-on-surface-variant" />
                        </div>
                        <div className="space-y-4">
                            {data?.topCourts?.length > 0 ? (
                                data.topCourts.slice(0, 5).map((court, index) => (
                                    <div key={court.id || index} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center text-lg shrink-0">
                                            {getSportIcon(court.sportType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-on-surface truncate">{court.name}</p>
                                            <p className="text-xs text-on-surface-variant font-mono">{court.bookings || 0} bookings</p>
                                        </div>
                                        <p className="font-mono font-semibold text-on-surface">₹{(court.revenue || 0).toLocaleString()}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-on-surface-variant py-4">No court data available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sports Revenue cards */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display text-lg font-semibold text-on-surface">Revenue by Sport</h3>
                        <Icon name="trending_up" size={20} className="text-on-surface-variant" />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {sportsEntries.length > 0 ? (
                            sportsEntries.map(([sport, revenue], idx) => {
                                const pct = sportsTotal > 0 ? Math.round((revenue / sportsTotal) * 100) : 0;
                                return (
                                    <div
                                        key={sport}
                                        className="flex-1 min-w-[160px] bg-surface-container-low rounded-2xl p-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{getSportIcon(sport)}</span>
                                            <span className="text-sm font-medium text-on-surface capitalize">{sport.toLowerCase().replace('_', ' ')}</span>
                                        </div>
                                        <p className="font-mono text-xl font-semibold text-on-surface">₹{revenue.toLocaleString()}</p>
                                        <div className="mt-2 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getSportColor(sport, idx)} rounded-full`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-1 font-mono">{pct}% of total</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full text-center py-8">
                                <p className="text-on-surface-variant">No sports revenue data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
