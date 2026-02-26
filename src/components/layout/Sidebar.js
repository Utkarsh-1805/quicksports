'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Home,
    CalendarDays,
    User,
    Settings,
    LogOut,
    BarChart3,
    MapPin,
    Users,
    CheckSquare,
    FileText,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';

export function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const getLinks = () => {
        switch (user?.role) {
            case 'ADMIN':
                return [
                    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
                    { name: 'Approvals', href: '/admin/approvals', icon: CheckSquare },
                    { name: 'Users', href: '/admin/users', icon: Users },
                    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
                    { name: 'Reports', href: '/admin/reports', icon: FileText },
                    { name: 'Settings', href: '/admin/settings', icon: Settings },
                ];
            case 'FACILITY_OWNER':
                return [
                    { name: 'Dashboard', href: '/owner/dashboard', icon: Home },
                    { name: 'My Venues', href: '/owner/venues', icon: MapPin },
                    { name: 'Bookings', href: '/owner/bookings', icon: CalendarDays },
                    { name: 'Analytics', href: '/owner/analytics', icon: BarChart3 },
                    { name: 'Profile', href: '/owner/profile', icon: User },
                ];
            default: // USER
                return [
                    { name: 'Dashboard', href: '/dashboard', icon: Home },
                    { name: 'My Bookings', href: '/dashboard/bookings', icon: CalendarDays },
                    { name: 'Saved Venues', href: '/dashboard/saved', icon: MapPin },
                    { name: 'Profile', href: '/dashboard/profile', icon: User },
                    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
                ];
        }
    };

    const links = getLinks();

    return (
        <>
            {/* Mobile Toggle Button (Visible only on small screens) */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-green-600 text-white rounded-full shadow-lg shadow-green-500/30 hover:scale-105 transition-transform"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed md:sticky top-0 lg:top-[88px] h-screen lg:h-[calc(100vh-88px)] z-50 transition-all duration-300 ease-in-out
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          ${mobileOpen ? 'left-0 w-72' : '-left-full md:left-0'}
        `}
            >
                <div className="flex flex-col h-full bg-white border-r border-slate-200">
                    {/* Header */}
                    <div className={`flex items-center justify-between p-4 border-b border-slate-100 h-20 ${collapsed ? 'justify-center' : ''}`}>
                        {!collapsed && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex justify-center items-center text-white font-bold text-lg shadow-sm">
                                    {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-slate-800 truncate">{user?.name}</h3>
                                    <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                                </div>
                            </div>
                        )}
                        {collapsed && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex justify-center items-center text-white font-bold text-lg shadow-sm cursor-pointer" title={user?.name}>
                                {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                            </div>
                        )}

                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Mobile Close Toggle */}
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-green-50 text-green-700 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        } ${collapsed ? 'justify-center' : ''}`}
                                    title={collapsed ? link.name : ''}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-slate-400'}`} />
                                    {!collapsed && <span>{link.name}</span>}
                                    {isActive && !collapsed && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={logout}
                            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? "Logout" : ""}
                        >
                            <LogOut className="w-5 h-5" />
                            {!collapsed && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
