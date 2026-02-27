'use client';

import Link from 'next/link';
import { 
    Plus, 
    Building2, 
    Calendar, 
    BarChart3, 
    Settings,
    Users,
    Clock,
    FileText,
    ChevronRight
} from 'lucide-react';

/**
 * OwnerQuickActions Component
 * Quick action buttons for owner dashboard
 */
export function OwnerQuickActions() {
    const actions = [
        {
            icon: Plus,
            label: 'Add Facility',
            description: 'Create a new sports venue',
            href: '/owner/facilities/new',
            color: 'bg-purple-600 hover:bg-purple-700',
            textColor: 'text-white'
        },
        {
            icon: Building2,
            label: 'Manage Facilities',
            description: 'View and edit your venues',
            href: '/owner/facilities',
            color: 'bg-white hover:bg-slate-50',
            textColor: 'text-slate-900',
            border: true
        },
        {
            icon: Calendar,
            label: 'View Bookings',
            description: 'Check all reservations',
            href: '/owner/bookings',
            color: 'bg-white hover:bg-slate-50',
            textColor: 'text-slate-900',
            border: true
        },
        {
            icon: BarChart3,
            label: 'Analytics',
            description: 'Revenue & performance',
            href: '/owner/analytics',
            color: 'bg-white hover:bg-slate-50',
            textColor: 'text-slate-900',
            border: true
        }
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Quick Actions</h3>
                    <p className="text-sm text-slate-500">Common tasks</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className={`p-4 rounded-xl transition-all ${action.color} ${action.border ? 'border border-slate-200' : ''} group`}
                        >
                            <div className={`w-10 h-10 rounded-lg ${action.border ? 'bg-purple-50' : 'bg-white/20'} flex items-center justify-center mb-3`}>
                                <Icon className={`w-5 h-5 ${action.border ? 'text-purple-600' : 'text-white'}`} />
                            </div>
                            <p className={`font-medium ${action.textColor}`}>{action.label}</p>
                            <p className={`text-xs mt-0.5 ${action.border ? 'text-slate-500' : 'text-white/80'}`}>
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
