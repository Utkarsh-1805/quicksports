'use client';

import Link from 'next/link';
import { 
    Search, 
    Calendar, 
    User, 
    Bell, 
    CreditCard,
    MapPin,
    ChevronRight
} from 'lucide-react';

/**
 * QuickActions Component
 * Grid of quick action buttons for dashboard
 */
export function QuickActions() {
    const actions = [
        {
            title: 'Book a Court',
            description: 'Find and book sports facilities',
            icon: Search,
            href: '/venues',
            gradient: 'from-green-500 to-green-600',
            primary: true
        },
        {
            title: 'My Bookings',
            description: 'View all your reservations',
            icon: Calendar,
            href: '/dashboard/bookings',
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        },
        {
            title: 'Profile',
            description: 'Manage your account',
            icon: User,
            href: '/dashboard/profile',
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
        },
        {
            title: 'Notifications',
            description: 'Check your updates',
            icon: Bell,
            href: '/dashboard/notifications',
            color: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action) => {
                const Icon = action.icon;
                
                if (action.primary) {
                    return (
                        <Link
                            key={action.title}
                            href={action.href}
                            className={`col-span-2 md:col-span-1 p-5 rounded-2xl bg-gradient-to-br ${action.gradient} text-white hover:shadow-lg hover:scale-[1.02] transition-all`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                            <p className="text-sm text-white/80">{action.description}</p>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={action.title}
                        href={action.href}
                        className={`p-5 rounded-2xl ${action.color} transition-all hover:shadow-md group`}
                    >
                        <Icon className="w-8 h-8 mb-3" />
                        <h3 className="font-semibold text-slate-800 mb-0.5 group-hover:text-slate-900">{action.title}</h3>
                        <p className="text-xs text-slate-500">{action.description}</p>
                    </Link>
                );
            })}
        </div>
    );
}

export default QuickActions;
