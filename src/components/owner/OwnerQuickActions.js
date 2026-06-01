'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/**
 * OwnerQuickActions Component
 * Quick action buttons for owner dashboard
 */
export function OwnerQuickActions() {
    const actions = [
        {
            iconName: 'add',
            label: 'Add Facility',
            description: 'Create a new sports venue',
            href: '/owner/facilities/new',
            primary: true
        },
        {
            iconName: 'domain',
            label: 'Manage Facilities',
            description: 'View and edit your venues',
            href: '/owner/facilities'
        },
        {
            iconName: 'calendar_today',
            label: 'View Bookings',
            description: 'Check all reservations',
            href: '/owner/bookings'
        },
        {
            iconName: 'payments',
            label: 'Earnings',
            description: 'Revenue & payouts',
            href: '/owner/earnings'
        },
        {
            iconName: 'reviews',
            label: 'Reviews',
            description: 'Customer feedback',
            href: '/owner/reviews'
        }
    ];

    return (
        <div className="card p-6">
            <h3 className="font-display text-base font-semibold text-on-surface mb-5">Quick actions</h3>

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                    if (action.primary) {
                        return (
                            <Link
                                key={action.label}
                                href={action.href}
                                className="p-4 rounded-2xl bg-primary text-on-primary transition-all hover:opacity-95 hover:shadow-lg group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-on-primary/20 flex items-center justify-center mb-3">
                                    <Icon name={action.iconName} size={20} className="text-on-primary" />
                                </div>
                                <p className="font-display font-semibold">{action.label}</p>
                                <p className="text-xs mt-0.5 text-on-primary/80">
                                    {action.description}
                                </p>
                            </Link>
                        );
                    }
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-3">
                                <Icon name={action.iconName} size={20} />
                            </div>
                            <p className="font-display font-semibold text-on-surface">{action.label}</p>
                            <p className="text-xs mt-0.5 text-on-surface-variant">
                                {action.description}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default OwnerQuickActions;
