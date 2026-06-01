'use client';

import { Icon } from '@/components/ui/Icon';

/**
 * StatsCard Component
 * Displays a stat with icon, value, and optional trend indicator
 */
export function StatsCard({
    title,
    value,
    icon: IconComponent,
    trend,
    trendValue,
    subtitle,
    className = '',
    gradient = false
}) {
    const getTrendIconName = () => {
        if (!trend) return null;
        if (trend === 'up') return 'trending_up';
        if (trend === 'down') return 'trending_down';
        return 'remove';
    };

    const getTrendColor = () => {
        if (trend === 'up') return 'text-on-primary-container bg-primary-container';
        if (trend === 'down') return 'text-on-error-container bg-error-container';
        return 'text-on-surface-variant bg-surface-container';
    };

    if (gradient) {
        return (
            <div className={`card card-hover relative overflow-hidden p-[22px] bg-inverse-surface text-inverse-on-surface border-transparent ${className}`}>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-inverse-on-surface/10"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-inverse-on-surface/5"></div>

                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-inverse-on-surface/15 flex items-center justify-center backdrop-blur-sm">
                            {IconComponent && <IconComponent className="w-5 h-5 text-inverse-on-surface" />}
                        </div>
                        {trend && trendValue && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-inverse-on-surface/15 text-xs font-medium font-mono">
                                <Icon name={getTrendIconName()} size={16} />
                                {trendValue}
                            </div>
                        )}
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-80 mb-2">{title}</p>
                    <p className="font-display text-4xl font-semibold tracking-tight">{value}</p>
                    {subtitle && <p className="text-sm opacity-70 mt-1.5">{subtitle}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={`card card-hover p-[22px] ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                </div>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${getTrendColor()}`}>
                        <Icon name={getTrendIconName()} size={14} />
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-2">{title}</p>
            <p className="font-display text-4xl font-semibold text-on-surface tracking-tight">{value}</p>
            {subtitle && <p className="text-sm text-on-surface-variant mt-1.5">{subtitle}</p>}
        </div>
    );
}

export default StatsCard;
