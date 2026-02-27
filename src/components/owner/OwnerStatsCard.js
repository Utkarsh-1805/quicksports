'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * OwnerStatsCard Component
 * Displays KPI metrics for owner dashboard
 */
export function OwnerStatsCard({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    trend = 'neutral', // 'up' | 'down' | 'neutral'
    trendValue,
    gradient = false,
    currency = false
}) {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'down':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-slate-400" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return 'text-green-600 bg-green-50';
            case 'down':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    if (gradient) {
        return (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            {Icon && <Icon className="w-6 h-6 text-white" />}
                        </div>
                        {trendValue && (
                            <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full text-sm backdrop-blur-sm">
                                {getTrendIcon()}
                                <span>{trendValue}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-white/80 mb-1">{title}</p>
                    <p className="text-3xl font-bold">{currency ? '₹' : ''}{value}</p>
                    {subtitle && <p className="text-sm text-white/60 mt-2">{subtitle}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    {Icon && <Icon className="w-6 h-6 text-purple-600" />}
                </div>
                {trendValue && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{currency ? '₹' : ''}{value}</p>
            {subtitle && <p className="text-sm text-slate-400 mt-2">{subtitle}</p>}
        </div>
    );
}

export default OwnerStatsCard;
