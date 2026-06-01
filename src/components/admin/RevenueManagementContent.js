'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * RevenueManagementContent Component
 * Admin interface for revenue analytics and financial overview
 */
export default function RevenueManagementContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/admin/revenue');
            return;
        }

        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchRevenue();
    }, [user, authLoading, period]);

    const fetchRevenue = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            const res = await fetch(`/api/admin/revenue?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await res.json();

            if (result.success) {
                // Map API response to component expected structure
                const analytics = result.data.analytics || result.data;
                const overview = analytics.overview || {};
                const growth = analytics.growth || {};
                const breakdown = analytics.breakdown || {};

                const refundAmount = overview.totalRefunds || 0;
                const refundCount = overview.refundCount || 0;
                const totalRevenue = overview.totalRevenue || 0;

                setData({
                    summary: {
                        totalRevenue,
                        totalBookings: overview.totalBookings || 0,
                        avgBookingValue: overview.avgBookingValue || 0,
                        netRevenue: overview.netRevenue || 0,
                        totalRefunds: refundAmount,
                        platformCommission: Math.round(totalRevenue * 0.1), // 10% commission estimate
                        growth: growth.revenueGrowth || 0,
                        bookingsGrowth: growth.bookingsGrowth || 0,
                        previousPeriod: growth.previousPeriod || {}
                    },
                    trends: (breakdown.byTime || []).map(item => ({
                        label: item.date,
                        revenue: item.revenue || 0,
                        bookings: item.bookings || 0
                    })),
                    breakdown: {
                        byVenue: breakdown.byVenue || [],
                        bySport: breakdown.bySport || [],
                        byPaymentMethod: breakdown.byPaymentMethod || []
                    },
                    refunds: {
                        count: refundCount,
                        amount: refundAmount,
                        rate: totalRevenue > 0 ? Math.round((refundAmount / totalRevenue) * 1000) / 10 : 0,
                        avgAmount: refundCount > 0 ? Math.round((refundAmount / refundCount) * 100) / 100 : 0,
                    },
                    projections: analytics.projections || null
                });
            } else {
                throw new Error(result.message || 'Failed to load revenue data');
            }
        } catch (err) {
            console.error('Fetch revenue error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toLocaleString()}`;
    };

    const formatPercentage = (value) => {
        if (!value && value !== 0) return '0%';
        const formatted = Math.round(value * 10) / 10;
        return `${formatted >= 0 ? '+' : ''}${formatted}%`;
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 w-64 bg-surface-container rounded mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-36 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <h2 className="font-display text-xl text-on-surface mb-2">Error Loading Revenue</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <Button onClick={fetchRevenue}>
                        <Icon name="refresh" size={16} className="mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { summary, trends, breakdown, refunds, projections } = data || {};

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-6 border-b border-outline-variant">
                    <div>
                        <div className="eyebrow mb-3">Admin Console</div>
                        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-on-surface">Platform revenue</h1>
                        <p className="text-sm text-on-surface-variant mt-1">High-level financial breakdown and performance metrics.</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="input font-mono cursor-pointer"
                            style={{ width: 'auto', padding: '10px 14px', fontSize: 13 }}
                        >
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">Last 30 Days</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <button
                            onClick={fetchRevenue}
                            className="btn btn-primary btn-sm"
                        >
                            <Icon name="download" size={20} />
                            Export Report
                        </button>
                    </div>
                </header>

                {/* Key Metrics Bento Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Gross Revenue */}
                    <div className="card card-hover p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                                <Icon name="payments" size={20} />
                            </div>
                            <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold ${(summary?.growth || 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                                <Icon name={(summary?.growth || 0) >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {formatPercentage(summary?.growth)}
                            </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">Gross Booking Volume</p>
                        <p className="font-display font-mono text-4xl tracking-tight text-on-surface mt-2">{formatCurrency(summary?.totalRevenue)}</p>
                    </div>

                    {/* Platform Fees */}
                    <div className="card card-hover p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--secondary-fixed)', color: '#5c2400' }}>
                                <Icon name="account_balance" size={20} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-primary">
                                <Icon name="trending_up" size={14} /> 10%
                            </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">Platform Commission</p>
                        <p className="font-display font-mono text-4xl tracking-tight text-on-surface mt-2">{formatCurrency(summary?.platformCommission)}</p>
                    </div>

                    {/* Net Revenue / Avg Booking Value */}
                    <div className="card card-hover p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                                <Icon name="savings" size={20} />
                            </div>
                            <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold ${(summary?.bookingsGrowth || 0) >= 0 ? 'text-primary' : 'text-error'}`}>
                                <Icon name={(summary?.bookingsGrowth || 0) >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                                {formatPercentage(summary?.bookingsGrowth)}
                            </span>
                        </div>
                        <p className="text-sm text-on-surface-variant relative z-10">Net Revenue</p>
                        <p className="font-display font-mono text-4xl tracking-tight text-on-surface mt-2 relative z-10">{formatCurrency(summary?.netRevenue || summary?.totalRevenue)}</p>
                    </div>
                </section>

                {/* Sub-metrics row */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="card p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-xl flex items-center justify-center">
                            <Icon name="event_available" size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-on-surface-variant">Paid Bookings</p>
                            <p className="font-display font-mono text-2xl text-on-surface">{summary?.totalBookings?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="card p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--secondary-fixed)', color: '#5c2400' }}>
                            <Icon name="track_changes" size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-on-surface-variant">Avg. Booking Value</p>
                            <p className="font-display font-mono text-2xl text-on-surface">{formatCurrency(summary?.avgBookingValue)}</p>
                        </div>
                    </div>
                </section>

                {/* Charts Section */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    {/* Revenue Growth Chart */}
                    <div className="lg:col-span-2 card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display text-2xl text-on-surface">Platform Growth</h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-primary text-on-primary text-xs font-mono rounded-lg shadow-sm">
                                    {period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly'}
                                </button>
                            </div>
                        </div>

                        {trends?.length > 0 ? (
                            <>
                                <div className="h-64 relative w-full flex items-end justify-between gap-2 border-b border-l border-outline-variant/40 pb-2 pl-2">
                                    {trends.slice(-12).map((item, index) => {
                                        const maxRevenue = Math.max(...trends.map(t => t.revenue || 0));
                                        const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                                        const isLatest = index === Math.min(trends.length, 12) - 1;

                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                <div
                                                    className={`w-full rounded-t-sm transition-colors relative ${
                                                        isLatest ? 'bg-primary shadow-[0_-4px_12px_rgba(0,107,44,0.2)]' : 'bg-primary-container/40 hover:bg-primary-container/60'
                                                    }`}
                                                    style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                                                >
                                                    <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-mono text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                                        {formatCurrency(item.revenue)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-2 text-xs font-mono text-on-surface-variant/70 pl-2">
                                    {trends.slice(-12).map((item, index) => (
                                        <span key={index} className="flex-1 text-center truncate">{item.label}</span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-on-surface-variant">No trend data available</p>
                            </div>
                        )}
                    </div>

                    {/* Top Sport / Performance Breakdown */}
                    <div className="card p-6 flex flex-col">
                        <h3 className="font-display text-2xl text-on-surface mb-6">Top Sports</h3>
                        <div className="flex-1 space-y-4">
                            {breakdown?.bySport?.length > 0 ? (
                                breakdown.bySport.slice(0, 5).map((item, index) => {
                                    const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-outline', 'bg-secondary-container'];
                                    const totalRevenue = breakdown.bySport.reduce((sum, s) => sum + (s.revenue || 0), 0);
                                    const percentage = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;

                                    return (
                                        <div key={index}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-on-surface">{item.sport}</span>
                                                <span className="text-xs font-mono text-on-surface-variant">{formatCurrency(item.revenue)}</span>
                                            </div>
                                            <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`${colors[index % colors.length]} h-full rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-on-surface-variant text-center py-8">No sport data available</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Top Venues & Refunds */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-2xl text-on-surface">Top Revenue Venues</h3>
                            <Icon name="domain" className="text-on-surface-variant" />
                        </div>
                        {breakdown?.byVenue?.length > 0 ? (
                            <div className="space-y-4">
                                {breakdown.byVenue.slice(0, 5).map((venue, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-mono font-bold text-on-surface-variant text-sm">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-on-surface truncate">{venue.name}</p>
                                            <p className="text-sm font-mono text-on-surface-variant">{venue.bookings} bookings</p>
                                        </div>
                                        <p className="font-mono font-semibold text-primary">{formatCurrency(venue.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Icon name="domain" className="text-outline mx-auto mb-2" size={32} />
                                <p className="text-on-surface-variant">No venue data available</p>
                            </div>
                        )}
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-display text-2xl text-on-surface">Refunds Overview</h3>
                            <Icon name="credit_card" className="text-on-surface-variant" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
                                <p className="text-sm text-on-surface-variant mb-1">Total Refunds</p>
                                <p className="font-display font-mono text-xl text-on-surface">{refunds?.count || 0}</p>
                            </div>
                            <div className="bg-error-container rounded-xl p-4">
                                <p className="text-sm text-on-error-container mb-1">Refund Amount</p>
                                <p className="font-display font-mono text-xl text-on-error-container">{formatCurrency(refunds?.amount || summary?.totalRefunds)}</p>
                            </div>
                            <div className="col-span-2 rounded-xl p-4" style={{ background: 'var(--secondary-fixed)', border: '1px solid var(--secondary-fixed-dim)' }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm mb-1" style={{ color: '#5c2400' }}>Refund Rate</p>
                                        <p className="font-display font-mono text-xl" style={{ color: '#5c2400' }}>{refunds?.rate || 0}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm mb-1" style={{ color: '#5c2400' }}>Avg. Refund</p>
                                        <p className="font-mono text-lg font-semibold" style={{ color: '#5c2400' }}>{formatCurrency(refunds?.avgAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Projections */}
                {projections && (
                    <section className="card p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h3 className="font-display text-2xl text-on-surface">Revenue Projections</h3>
                            <Icon name="trending_up" className="text-primary" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                            <div>
                                <p className="text-sm text-on-surface-variant mb-1">This Month (Est.)</p>
                                <p className="font-display font-mono text-2xl text-on-surface">{formatCurrency(projections?.thisMonth)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-on-surface-variant mb-1">Next Month (Est.)</p>
                                <p className="font-display font-mono text-2xl text-on-surface">{formatCurrency(projections?.nextMonth)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-on-surface-variant mb-1">This Quarter (Est.)</p>
                                <p className="font-display font-mono text-2xl text-on-surface">{formatCurrency(projections?.thisQuarter)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-on-surface-variant mb-1">This Year (Est.)</p>
                                <p className="font-display font-mono text-2xl text-on-surface">{formatCurrency(projections?.thisYear)}</p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
