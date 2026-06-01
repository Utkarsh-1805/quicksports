'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/**
 * QuickActions Component
 * Grid of quick action buttons for dashboard, M3-tokenized
 */
export function QuickActions() {
    const actions = [
        {
            title: 'Book a Court',
            description: 'Find and book sports facilities',
            icon: 'search',
            href: '/venues',
            primary: true,
        },
        {
            title: 'My Bookings',
            description: 'View all your reservations',
            icon: 'event',
            href: '/dashboard/bookings',
        },
        {
            title: 'Profile',
            description: 'Manage your account',
            icon: 'person',
            href: '/dashboard/profile',
        },
        {
            title: 'Notifications',
            description: 'Check your updates',
            icon: 'notifications',
            href: '/dashboard/notifications',
        },
        {
            title: 'My Reviews',
            description: 'Manage your reviews',
            icon: 'rate_review',
            href: '/dashboard/reviews',
        },
    ];

    return (
        <div>
            <h2 className="font-display text-2xl font-semibold text-on-surface mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {actions.map((action) => {
                    if (action.primary) {
                        return (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="col-span-2 md:col-span-1 card card-hover p-5 bg-secondary-container text-on-secondary-container border-transparent"
                            >
                                <div className="w-9 h-9 rounded-[10px] bg-on-secondary-container/15 flex items-center justify-center mb-3">
                                    <Icon name={action.icon} size={20} />
                                </div>
                                <h3 className="font-display font-semibold text-lg mb-0.5">{action.title}</h3>
                                <p className="text-sm opacity-80">{action.description}</p>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={action.title}
                            href={action.href}
                            className="card card-hover p-5 group"
                        >
                            <div className="w-9 h-9 rounded-[10px] bg-surface-container flex items-center justify-center mb-3 group-hover:bg-primary-container transition-colors">
                                <Icon name={action.icon} size={20} className="text-on-surface group-hover:text-on-primary-container transition-colors" />
                            </div>
                            <h3 className="font-display font-semibold text-on-surface mb-0.5">{action.title}</h3>
                            <p className="text-xs text-on-surface-variant">{action.description}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default QuickActions;
