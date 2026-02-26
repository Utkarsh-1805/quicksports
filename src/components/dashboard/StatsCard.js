'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatsCard Component
 * Displays a stat with icon, value, and optional trend indicator
 */
export function StatsCard({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    subtitle,
    className = '',
    gradient = false
}) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600 bg-green-50';
        if (trend === 'down') return 'text-red-600 bg-red-50';
        return 'text-slate-600 bg-slate-50';
    };

    if (gradient) {
        return (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg ${className}`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5"></div>
                
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            {Icon && <Icon className="w-6 h-6 text-white" />}
                        </div>
                        {trend && trendValue && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-xs font-medium">
                                {getTrendIcon()}
                                {trendValue}
                            </div>
                        )}
                    </div>
                    <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 p-6 hover:border-green-200 hover:shadow-md transition-all ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    {Icon && <Icon className="w-6 h-6 text-green-600" />}
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                        {getTrendIcon()}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        </div>
    );
}

export default StatsCard;
