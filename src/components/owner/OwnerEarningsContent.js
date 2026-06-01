'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronRight,
    Loader2,
    AlertCircle,
    Download,
    ChevronDown,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});

function EarningsCard({ title, value, icon, trend, trendValue, subtitle, hero }) {
    const trendIconName = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';
    const trendClass = hero
        ? 'text-on-primary-container'
        : trend === 'up'
            ? 'text-primary'
            : trend === 'down'
                ? 'text-error'
                : 'text-on-surface-variant';

    if (hero) {
        return (
            <div className="card p-5 bg-primary-container text-on-primary-container border-transparent relative overflow-hidden">
                <div className="absolute -right-6 -top-6 opacity-10 pointer-events-none">
                    <Icon name={icon} size={140} filled />
                </div>
                <div className="flex items-start justify-between relative">
                    <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                        <Icon name={icon} size={20} />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] font-semibold">Next</span>
                </div>
                <p className="text-sm opacity-90 mt-[18px] relative">{title}</p>
                <p className="font-display font-mono font-semibold text-[32px] leading-tight tracking-tight relative">{value}</p>
                {subtitle && (
                    <p className="font-mono text-xs opacity-90 mt-1.5 relative">{subtitle}</p>
                )}
            </div>
        );
    }

    return (
        <div className="card card-hover p-5">
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <Icon name={icon} size={20} />
                </div>
                {trendValue && (
                    <div className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${trendClass}`}>
                        <Icon name={trendIconName} size={14} />
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-on-surface-variant mt-[18px]">{title}</p>
            <p className="font-display font-mono font-semibold text-[28px] leading-tight tracking-tight text-on-surface">{value}</p>
            {subtitle && (
                <p className="text-xs text-on-surface-variant/80 mt-2">{subtitle}</p>
            )}
        </div>
    );
}

function TransactionRow({ transaction }) {
    const statusConfig = {
        'COMPLETED': { pill: 'pill', label: 'Processed' },
        'SUCCESS': { pill: 'pill', label: 'Processed' },
        'PENDING': { pill: 'pill secondary', label: 'Pending' },
        'FAILED': { pill: 'pill error', label: 'Failed' },
        'REFUNDED': { pill: 'pill tertiary', label: 'Refunded' }
    };
    const cfg = statusConfig[transaction.status] || { pill: 'pill neutral', label: transaction.status };

    return (
        <tr className="hover:bg-surface-container-low/50 transition-colors">
            <td className="p-4 text-on-surface text-sm font-mono">{formatDate(transaction.date)}</td>
            <td className="p-4 text-on-surface text-sm">
                <p className="font-medium">{transaction.venueName || 'Booking Payment'}</p>
                {transaction.courtName && (
                    <p className="text-xs text-on-surface-variant">{transaction.courtName}</p>
                )}
            </td>
            <td className="p-4 font-mono text-sm text-on-surface-variant">#BKG-{String(transaction.id || '').slice(-4) || '0000'}</td>
            <td className="p-4 font-mono text-sm font-semibold text-on-surface">{formatCurrency(transaction.amount)}</td>
            <td className="p-4">
                <span className={cfg.pill}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                    {cfg.label}
                </span>
            </td>
        </tr>
    );
}

export default function OwnerEarningsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { owner: ownerApi } = useApi();

    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');
    const [showPeriodMenu, setShowPeriodMenu] = useState(false);

    const periods = [
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' },
        { value: 'all', label: 'All Time' }
    ];

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/owner/earnings');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchEarnings();
    }, [user, authLoading, period]);

    const fetchEarnings = async () => {
        setLoading(true);
        setError(null);

        try {
            const { success, data, error: apiError } = await ownerApi.getEarnings({ period });

            if (success && data) {
                setEarnings(data);
            } else {
                throw new Error(apiError || 'Failed to load earnings');
            }
        } catch (err) {
            console.error('Fetch earnings error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="progress_activity" size={48} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-on-surface-variant">Loading earnings...</p>
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
                    <h2 className="font-display text-xl font-semibold text-on-surface mb-2">Error Loading Earnings</h2>
                    <p className="text-on-surface-variant mb-6">{error}</p>
                    <button
                        onClick={fetchEarnings}
                        className="btn btn-cta"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { summary, transactions = [], venueBreakdown = [] } = earnings || {};

    // Donut math
    const donutTotal = venueBreakdown.reduce((sum, v) => sum + (v.earnings || 0), 0);
    const donutColors = ['stroke-primary', 'stroke-secondary', 'stroke-tertiary', 'stroke-error', 'stroke-primary-container'];
    const dotColors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-error', 'bg-primary-container'];

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header - Hero Total Earnings */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
                            <Link href="/owner/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                            <Icon name="chevron_right" size={16} />
                            <span className="text-on-surface">Earnings</span>
                        </div>
                        <p className="eyebrow mb-2">Total Earnings</p>
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <h1 className="font-display font-mono text-5xl sm:text-6xl font-semibold text-on-surface tracking-tight">{formatCurrency(summary?.totalEarnings || 0)}</h1>
                            {summary?.earningsTrend !== undefined && summary?.earningsTrend !== null && (
                                <span className={
                                    summary.earningsTrend > 0
                                        ? 'pill'
                                        : summary.earningsTrend < 0
                                            ? 'pill error'
                                            : 'pill neutral'
                                }>
                                    <Icon name={summary.earningsTrend > 0 ? 'trending_up' : summary.earningsTrend < 0 ? 'trending_down' : 'trending_flat'} size={14} />
                                    {summary.earningsTrend > 0 ? '+' : ''}{summary.earningsTrend}% vs last period
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Period Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                                className="btn btn-outline btn-sm"
                            >
                                {periods.find(p => p.value === period)?.label}
                                <Icon name="expand_more" size={18} />
                            </button>
                            {showPeriodMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-44 card p-1 z-20">
                                        {periods.map((p) => (
                                            <button
                                                key={p.value}
                                                onClick={() => {
                                                    setPeriod(p.value);
                                                    setShowPeriodMenu(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left text-sm rounded-lg hover:bg-surface-container transition-colors ${period === p.value ? 'text-primary font-semibold bg-primary-container/10' : 'text-on-surface'}`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <button className="btn btn-outline btn-sm">
                            <Icon name="download" size={18} />
                            Export CSV
                        </button>
                        <button className="btn btn-outline btn-sm">
                            <Icon name="picture_as_pdf" size={18} />
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <EarningsCard
                        title="Next Payout"
                        value={formatCurrency(summary?.pendingPayouts || 0)}
                        icon="account_balance"
                        hero
                        subtitle={(() => {
                            if (!summary?.nextPayoutDate) return 'Scheduled weekly';
                            const date = new Date(summary.nextPayoutDate);
                            const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                            const dateLabel = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                            return days === 0 ? `Today (${dateLabel})` : days === 1 ? `Tomorrow (${dateLabel})` : `In ${days} days (${dateLabel})`;
                        })()}
                    />
                    <EarningsCard
                        title="Pending Payouts"
                        value={formatCurrency(summary?.pendingPayouts || 0)}
                        icon="schedule"
                    />
                    <EarningsCard
                        title="Total Bookings"
                        value={summary?.totalBookings || 0}
                        icon="event_available"
                        trend="up"
                        trendValue={`+${summary?.bookingsTrend || 0}%`}
                    />
                    <EarningsCard
                        title="Avg. Booking Value"
                        value={formatCurrency(summary?.avgBookingValue || 0)}
                        icon="payments"
                    />
                </div>

                {/* Bento grid: Trend + Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Trend Chart */}
                    <div className="lg:col-span-2 card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display text-lg font-semibold text-on-surface">Revenue trend</h3>
                            <div className="flex items-center bg-surface-container rounded-[10px] p-1">
                                <button className="px-3 py-1 text-xs font-mono font-medium text-on-surface hover:bg-surface-container-high rounded-md transition-colors">Daily</button>
                                <button className="px-3 py-1 text-xs font-mono font-semibold bg-surface-container-lowest text-on-surface rounded-md shadow-sm">Weekly</button>
                                <button className="px-3 py-1 text-xs font-mono font-medium text-on-surface hover:bg-surface-container-high rounded-md transition-colors">Monthly</button>
                            </div>
                        </div>
                        {/* Mock chart area */}
                        <div className="w-full h-64 bg-gradient-to-t from-primary-container/10 to-transparent border-b-2 border-primary relative flex items-end rounded-md">
                            <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="earnGrad" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,80 C10,70 20,90 30,60 C40,30 50,70 60,40 C70,15 80,55 90,25 L100,15 L100,100 L0,100 Z" fill="url(#earnGrad)" />
                                <path d="M0,80 C10,70 20,90 30,60 C40,30 50,70 60,40 C70,15 80,55 90,25 L100,15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            </svg>
                        </div>
                    </div>

                    {/* Venue Breakdown Donut */}
                    <div className="card p-6">
                        <h3 className="font-display text-lg font-semibold text-on-surface mb-6">By facility</h3>

                        {venueBreakdown.length === 0 ? (
                            <div className="text-center py-12">
                                <Icon name="domain" size={48} className="text-outline-variant mx-auto mb-3" />
                                <p className="text-on-surface-variant text-sm">No venue data</p>
                            </div>
                        ) : (
                            <>
                                {/* SVG Donut */}
                                <div className="flex items-center justify-center mb-6">
                                    <div className="relative w-40 h-40">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="transparent" className="stroke-surface-container" strokeWidth="14" />
                                            {(() => {
                                                let cumulative = 0;
                                                const C = 2 * Math.PI * 40;
                                                return venueBreakdown.slice(0, 5).map((v, idx) => {
                                                    const pct = donutTotal > 0 ? (v.earnings || 0) / donutTotal : 0;
                                                    const dash = pct * C;
                                                    const offset = -cumulative * C;
                                                    cumulative += pct;
                                                    return (
                                                        <circle
                                                            key={v.id || idx}
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            fill="transparent"
                                                            className={donutColors[idx % donutColors.length]}
                                                            strokeWidth="14"
                                                            strokeDasharray={`${dash} ${C - dash}`}
                                                            strokeDashoffset={offset}
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="font-mono text-base font-bold text-on-surface">{venueBreakdown.length}</span>
                                            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Venues</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {venueBreakdown.slice(0, 5).map((venue, idx) => {
                                        const pct = donutTotal > 0 ? Math.round(((venue.earnings || 0) / donutTotal) * 100) : 0;
                                        return (
                                            <div key={venue.id || idx} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className={`w-3 h-3 rounded-full shrink-0 ${dotColors[idx % dotColors.length]}`} />
                                                    <span className="text-on-surface truncate">{venue.name}</span>
                                                </div>
                                                <span className="font-mono text-on-surface-variant">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="card overflow-hidden">
                    <div className="p-5 border-b border-outline-variant flex justify-between items-center">
                        <h3 className="font-display text-base font-semibold text-on-surface">Recent transactions</h3>
                        <Link href="/owner/bookings" className="text-primary hover:opacity-80 text-sm font-semibold transition-colors flex items-center gap-1">
                            View all
                            <Icon name="arrow_forward" size={14} />
                        </Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <Icon name="payments" size={48} className="text-outline-variant mx-auto mb-3" />
                            <p className="text-on-surface-variant">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-[0.08em] font-semibold font-mono border-b border-outline-variant">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Facility</th>
                                        <th className="p-4">Booking ID</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/50">
                                    {transactions.slice(0, 10).map((tx, idx) => (
                                        <TransactionRow key={tx.id || idx} transaction={tx} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
