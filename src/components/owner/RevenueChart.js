'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * RevenueChart Component
 * Displays revenue trends with bar chart visualization
 */
export function RevenueChart({ data = [], loading = false }) {
    const [period, setPeriod] = useState('week');
    const [showPeriodMenu, setShowPeriodMenu] = useState(false);

    const periods = [
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last 30 Days' },
        { value: 'quarter', label: 'Last 3 Months' }
    ];

    // Stable preset heights for skeleton (avoids React purity error from Math.random in render)
    const skeletonHeights = [62, 38, 75, 49, 80, 33, 68, 55, 42, 70, 28, 64, 47, 73];

    // Get max value for scaling
    const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 1);

    // Format date for display
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get display data based on period
    const getDisplayData = () => {
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
        return data.slice(-days);
    };

    const displayData = getDisplayData();
    const totalRevenue = displayData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgRevenue = displayData.length > 0 ? totalRevenue / displayData.length : 0;

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-surface-container-high rounded animate-pulse"></div>
                    <div className="h-10 w-28 bg-surface-container-high rounded animate-pulse"></div>
                </div>
                <div className="h-64 flex items-end gap-1">
                    {skeletonHeights.map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-surface-container-high rounded-t animate-pulse"
                            style={{ height: `${h}%` }}
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-display text-lg font-semibold text-on-surface">Revenue trend</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Daily · gross, before platform fee</p>
                </div>

                {/* Period Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-[10px] text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                        <span className="font-mono text-xs">{periods.find(p => p.value === period)?.label}</span>
                        <Icon name="expand_more" size={16} />
                    </button>
                    {showPeriodMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                            <div className="absolute right-0 mt-2 w-40 card p-1 z-20">
                                {periods.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => {
                                            setPeriod(p.value);
                                            setShowPeriodMenu(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm rounded-lg hover:bg-surface-container transition-colors ${period === p.value ? 'text-primary font-semibold' : 'text-on-surface'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-surface-container-low rounded-2xl">
                    <p className="font-mono text-[11px] text-on-surface-variant font-semibold uppercase tracking-[0.08em]">Total Revenue</p>
                    <p className="font-display text-2xl font-semibold text-on-surface mt-1 font-mono">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl">
                    <p className="font-mono text-[11px] text-on-surface-variant font-semibold uppercase tracking-[0.08em]">Daily Average</p>
                    <p className="font-display text-2xl font-semibold text-on-surface mt-1 font-mono">₹{Math.round(avgRevenue).toLocaleString()}</p>
                </div>
            </div>

            {/* Chart */}
            {displayData.length > 0 ? (
                <div className="relative">
                    <div className="h-48 flex items-end gap-0.5">
                        {displayData.map((item, index) => {
                            const height = (item.revenue / maxRevenue) * 100;
                            const isHighest = item.revenue === maxRevenue;

                            return (
                                <div
                                    key={item.date || index}
                                    className="flex-1 group relative"
                                >
                                    <div
                                        className="w-full rounded-t-md transition-all duration-300"
                                        style={{
                                            height: `${Math.max(height, 2)}%`,
                                            backgroundColor: isHighest ? 'var(--secondary-container)' : 'var(--primary)',
                                            opacity: isHighest ? 1 : 0.85
                                        }}
                                    />

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <div className="bg-inverse-surface text-inverse-on-surface text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                            <p className="font-mono text-[10px] uppercase tracking-wide opacity-70">{formatDate(item.date)}</p>
                                            <p className="font-mono font-semibold">₹{item.revenue?.toLocaleString()}</p>
                                            <p className="font-mono opacity-70">{item.bookings} bookings</p>
                                        </div>
                                        <div
                                            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                                            style={{ borderTopColor: 'var(--inverse-surface)' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* X-axis labels - show every nth label */}
                    <div className="flex justify-between mt-3 text-xs text-on-surface-variant font-mono">
                        <span>{formatDate(displayData[0]?.date)}</span>
                        <span>{formatDate(displayData[Math.floor(displayData.length / 2)]?.date)}</span>
                        <span>{formatDate(displayData[displayData.length - 1]?.date)}</span>
                    </div>
                </div>
            ) : (
                <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                        <Icon name="trending_up" size={48} className="text-on-surface-variant/40 mx-auto mb-3" />
                        <p className="text-on-surface-variant">No revenue data available</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RevenueChart;
