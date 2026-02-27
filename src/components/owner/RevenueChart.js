'use client';

import { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';

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
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-10 w-28 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-64 flex items-end gap-1">
                    {[...Array(14)].map((_, i) => (
                        <div 
                            key={i} 
                            className="flex-1 bg-slate-200 rounded-t animate-pulse"
                            style={{ height: `${Math.random() * 60 + 20}%` }}
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Revenue Trends</h3>
                        <p className="text-sm text-slate-500">Daily revenue performance</p>
                    </div>
                </div>
                
                {/* Period Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        {periods.find(p => p.value === period)?.label}
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {showPeriodMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowPeriodMenu(false)} />
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                {periods.map((p) => (
                                    <button
                                        key={p.value}
                                        onClick={() => {
                                            setPeriod(p.value);
                                            setShowPeriodMenu(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${period === p.value ? 'text-purple-600 font-medium' : 'text-slate-700'}`}
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
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Daily Average</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">₹{Math.round(avgRevenue).toLocaleString()}</p>
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
                                        className={`w-full rounded-t transition-all duration-300 ${
                                            isHighest ? 'bg-purple-600' : 'bg-purple-200 hover:bg-purple-400'
                                        }`}
                                        style={{ height: `${Math.max(height, 2)}%` }}
                                    />
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                                            <p className="font-medium">{formatDate(item.date)}</p>
                                            <p className="text-purple-300">₹{item.revenue?.toLocaleString()}</p>
                                            <p className="text-slate-400">{item.bookings} bookings</p>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* X-axis labels - show every nth label */}
                    <div className="flex justify-between mt-3 text-xs text-slate-500">
                        <span>{formatDate(displayData[0]?.date)}</span>
                        <span>{formatDate(displayData[Math.floor(displayData.length / 2)]?.date)}</span>
                        <span>{formatDate(displayData[displayData.length - 1]?.date)}</span>
                    </div>
                </div>
            ) : (
                <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No revenue data available</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RevenueChart;
