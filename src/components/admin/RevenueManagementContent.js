'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    DollarSign,
    TrendingUp,
    TrendingDown,
    Building2,
    Calendar,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    RefreshCw,
    Download,
    Target,
    Percent,
    Wallet,
    CreditCard,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

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
                
                setData({
                    summary: {
                        totalRevenue: overview.totalRevenue || 0,
                        totalBookings: overview.totalBookings || 0,
                        avgBookingValue: overview.avgBookingValue || 0,
                        netRevenue: overview.netRevenue || 0,
                        totalRefunds: overview.totalRefunds || 0,
                        platformCommission: Math.round((overview.totalRevenue || 0) * 0.1), // 10% commission estimate
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
            <div className="min-h-screen bg-slate-50 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 bg-white rounded-xl"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[1, 2].map(i => (
                                <div key={i} className="h-80 bg-white rounded-xl"></div>
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
                <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Revenue</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Button onClick={fetchRevenue}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const { summary, trends, breakdown, refunds, projections } = data || {};

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Revenue Management</h1>
                        <p className="text-slate-500 mt-1">Financial analytics and insights</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        >
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <button
                            onClick={fetchRevenue}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-5 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium ${(summary?.growth || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {(summary?.growth || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {formatPercentage(summary?.growth)}
                            </div>
                        </div>
                        <p className="text-sm text-white/80 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue)}</p>
                    </div>

                    {/* Platform Commission */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Percent className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Platform Commission</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.platformCommission)}</p>
                    </div>

                    {/* Total Bookings */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Paid Bookings</p>
                        <p className="text-2xl font-bold text-slate-900">{summary?.totalBookings?.toLocaleString() || 0}</p>
                    </div>

                    {/* Avg Booking Value */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <Target className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Avg. Booking Value</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.avgBookingValue)}</p>
                    </div>
                </div>

                {/* Revenue Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Trend */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="h-56">
                            {trends?.length > 0 ? (
                                <div className="flex items-end justify-between h-full gap-2">
                                    {trends.slice(-12).map((item, index) => {
                                        const maxRevenue = Math.max(...trends.map(t => t.revenue || 0));
                                        const height = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                                        
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="relative w-full group">
                                                    <div 
                                                        className="w-full bg-gradient-to-t from-green-600 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-green-700 hover:to-emerald-500"
                                                        style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                                                    />
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                        {formatCurrency(item.revenue)}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-500 truncate max-w-full">{item.label}</span>
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

                    {/* Revenue by Sport */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Revenue by Sport</h3>
                            <PieChart className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {breakdown?.bySport?.length > 0 ? (
                                breakdown.bySport.slice(0, 5).map((item, index) => {
                                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                                    const totalRevenue = breakdown.bySport.reduce((sum, s) => sum + (s.revenue || 0), 0);
                                    const percentage = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                                    
                                    return (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-700">{item.sport}</span>
                                                <span className="text-sm text-slate-500">{formatCurrency(item.revenue)} ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-400">No sport data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Venues & Refunds */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Revenue Venues */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Top Revenue Venues</h3>
                            <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        {breakdown?.byVenue?.length > 0 ? (
                            <div className="space-y-4">
                                {breakdown.byVenue.slice(0, 5).map((venue, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{venue.name}</p>
                                            <p className="text-sm text-slate-500">{venue.bookings} bookings</p>
                                        </div>
                                        <p className="font-semibold text-slate-900">{formatCurrency(venue.revenue)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-400">No venue data available</p>
                            </div>
                        )}
                    </div>

                    {/* Refunds Overview */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-900">Refunds Overview</h3>
                            <CreditCard className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-500 mb-1">Total Refunds</p>
                                <p className="text-xl font-bold text-slate-900">{refunds?.count || 0}</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4">
                                <p className="text-sm text-red-600 mb-1">Refund Amount</p>
                                <p className="text-xl font-bold text-red-700">{formatCurrency(refunds?.amount)}</p>
                            </div>
                            <div className="col-span-2 bg-amber-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-amber-600 mb-1">Refund Rate</p>
                                        <p className="text-xl font-bold text-amber-700">{refunds?.rate || 0}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 mb-1">Avg. Refund</p>
                                        <p className="text-lg font-semibold text-slate-700">{formatCurrency(refunds?.avgAmount)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projections */}
                {projections && (
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold">Revenue Projections</h3>
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">This Month (Est.)</p>
                                <p className="text-2xl font-bold">{formatCurrency(projections?.thisMonth)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Next Month (Est.)</p>
                                <p className="text-2xl font-bold">{formatCurrency(projections?.nextMonth)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">This Quarter (Est.)</p>
                                <p className="text-2xl font-bold">{formatCurrency(projections?.thisQuarter)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">This Year (Est.)</p>
                                <p className="text-2xl font-bold">{formatCurrency(projections?.thisYear)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
