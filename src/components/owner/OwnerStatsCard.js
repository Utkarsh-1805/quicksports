'use client';

import { Icon } from '@/components/ui/Icon';

/**
 * OwnerStatsCard Component
 * Displays KPI metrics for owner dashboard
 */
export function OwnerStatsCard({
    title,
    value,
    icon: IconComponent,
    iconName,
    subtitle,
    trend = 'neutral', // 'up' | 'down' | 'neutral'
    trendValue,
    gradient = false,
    currency = false,
    color = 'primary'
}) {
    const getTrendIconName = () => {
        switch (trend) {
            case 'up':
                return 'trending_up';
            case 'down':
                return 'trending_down';
            default:
                return 'remove';
        }
    };

    // Map color prop to token classes
    const colorMap = {
        primary: { circle: 'bg-primary-container text-on-primary-container', text: 'text-on-primary-container' },
        secondary: { circle: 'bg-secondary-fixed text-on-secondary-container', text: 'text-on-secondary-container' },
        tertiary: { circle: 'bg-tertiary-container text-on-tertiary-container', text: 'text-on-tertiary-container' },
        error: { circle: 'bg-error-container text-on-error-container', text: 'text-on-error-container' }
    };
    const tone = colorMap[color] || colorMap.primary;

    // Render icon (legacy lucide component prop OR iconName)
    const renderIcon = (extraClass = '') => {
        if (iconName) {
            return <Icon name={iconName} size={20} className={extraClass} />;
        }
        if (IconComponent) {
            return <IconComponent className={`w-5 h-5 ${extraClass}`} />;
        }
        return null;
    };

    if (gradient) {
        return (
            <div className="card p-5 relative overflow-hidden bg-primary text-on-primary border-transparent">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-on-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-on-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                    <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-on-primary/20 flex items-center justify-center backdrop-blur-sm">
                            {renderIcon('text-on-primary')}
                        </div>
                        {trendValue && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-on-primary/90">
                                <Icon name={getTrendIconName()} size={14} />
                                <span className="font-mono">{trendValue}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-on-primary/80 mt-[18px]">{title}</p>
                    <p className="font-display text-[32px] font-semibold leading-tight mt-1 tracking-tight font-mono">{currency ? '₹' : ''}{value}</p>
                    {subtitle && <p className="text-xs text-on-primary/70 mt-2.5">{subtitle}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="card card-hover p-5">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${tone.circle} flex items-center justify-center`}>
                    {renderIcon(tone.text)}
                </div>
                {trendValue && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-error' : 'text-on-surface-variant'}`}>
                        <Icon name={getTrendIconName()} size={14} />
                        <span className="font-mono">{trendValue}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-on-surface-variant mt-[18px]">{title}</p>
            <p className="font-display text-[32px] font-semibold leading-tight mt-1 tracking-tight text-on-surface font-mono">{currency ? '₹' : ''}{value}</p>
            {subtitle && <p className="text-xs text-on-surface-variant/80 mt-2.5">{subtitle}</p>}
        </div>
    );
}

export default OwnerStatsCard;
