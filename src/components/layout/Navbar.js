'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, User, LogOut, Menu, X, Bell, Calendar, Settings, ChevronDown, Shield, Building2 } from 'lucide-react';

export function Navbar() {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);
    const userMenuRef = useRef(null);

    // Close mobile menu when route changes
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        if (mobileMenuOpen) {
            setMobileMenuOpen(false);
        }
        if (userMenuOpen) {
            setUserMenuOpen(false);
        }
    }

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            // Don't apply scroll effect on dashboard/admin/owner routes
            if (pathname.includes('/dashboard') || pathname.includes('/admin') || pathname.includes('/owner')) {
                setIsScrolled(true);
                return;
            }
            setIsScrolled(window.scrollY > 20);
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    // Always solid on dashboard, admin, owner, or auth pages
    const isSolidPage = pathname.includes('/dashboard') || pathname.includes('/admin') || pathname.includes('/owner') || pathname.includes('/auth');
    const navbarClasses = isSolidPage || isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3 text-slate-900'
        : 'bg-transparent py-5 text-white';

    const textClass = isSolidPage || isScrolled ? 'text-slate-600' : 'text-slate-200';
    const logoTextClass = isSolidPage || isScrolled ? 'text-slate-900' : 'text-white';
    const logoAccentClass = isSolidPage || isScrolled ? 'text-green-600' : 'text-green-400';

    // Role-based navigation links
    const getNavLinks = () => {
        if (!isAuthenticated) {
            return [
                { name: 'Find Venues', href: '/venues' },
                { name: 'Sports', href: '/sports' },
                { name: 'How it Works', href: '/about' },
            ];
        }

        if (user?.role === 'ADMIN') {
            return [
                { name: 'Dashboard', href: '/admin' },
                { name: 'Approvals', href: '/admin/approvals' },
                { name: 'Users', href: '/admin/users' },
                { name: 'Revenue', href: '/admin/revenue' },
            ];
        }

        if (user?.role === 'FACILITY_OWNER') {
            return [
                { name: 'Dashboard', href: '/owner/dashboard' },
                { name: 'My Venues', href: '/owner/venues' },
                { name: 'Analytics', href: '/owner/analytics' },
            ];
        }

        // Default USER role
        return [
            { name: 'Find Venues', href: '/venues' },
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'My Bookings', href: '/dashboard/bookings' },
        ];
    };

    const navLinks = getNavLinks();

    return (
        <>
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navbarClasses}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${logoTextClass}`}>
                                Quick<span className={logoAccentClass}>Court</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className={`hidden md:flex items-center gap-8 font-medium ${textClass}`}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`hover:text-green-500 transition-colors ${pathname === link.href ? 'text-green-500 font-semibold' : ''}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Auth Buttons / User Menu */}
                        <div className="hidden md:flex items-center gap-3">
                            {loading ? (
                                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                            ) : isAuthenticated ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className={`flex items-center gap-2 font-medium hover:opacity-80 transition-opacity ${logoTextClass}`}
                                    >
                                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md text-white">
                                            {user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                        </div>
                                        <span>{user?.name?.split(' ')[0]}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="font-semibold text-slate-900">{user?.name}</p>
                                                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                                                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                                    user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    user?.role === 'FACILITY_OWNER' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {user?.role === 'FACILITY_OWNER' ? 'Owner' : user?.role}
                                                </span>
                                            </div>
                                            
                                            <div className="py-1">
                                                {user?.role === 'ADMIN' ? (
                                                    <>
                                                        <Link
                                                            href="/admin"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Shield className="w-4 h-4 text-slate-400" />
                                                            Admin Panel
                                                        </Link>
                                                        <Link
                                                            href="/admin/approvals"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Building2 className="w-4 h-4 text-slate-400" />
                                                            Approvals
                                                        </Link>
                                                        <Link
                                                            href="/admin/users"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <User className="w-4 h-4 text-slate-400" />
                                                            Manage Users
                                                        </Link>
                                                    </>
                                                ) : user?.role === 'FACILITY_OWNER' ? (
                                                    <>
                                                        <Link
                                                            href="/owner/dashboard"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <User className="w-4 h-4 text-slate-400" />
                                                            Dashboard
                                                        </Link>
                                                        <Link
                                                            href="/owner/venues"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Building2 className="w-4 h-4 text-slate-400" />
                                                            My Venues
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            href="/dashboard"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <User className="w-4 h-4 text-slate-400" />
                                                            Dashboard
                                                        </Link>
                                                        <Link
                                                            href="/dashboard/bookings"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            My Bookings
                                                        </Link>
                                                    </>
                                                )}
                                                <Link
                                                    href="/dashboard/notifications"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Bell className="w-4 h-4 text-slate-400" />
                                                    Notifications
                                                </Link>
                                                <Link
                                                    href="/dashboard/profile"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4 text-slate-400" />
                                                    Settings
                                                </Link>
                                            </div>

                                            <div className="border-t border-slate-100 pt-1">
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Log out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link href="/auth/login">
                                        <button className={`px-5 py-2.5 font-medium rounded-xl transition-colors ${isSolidPage || isScrolled
                                            ? 'text-slate-700 hover:bg-slate-100'
                                            : 'text-white hover:bg-white/10'
                                            }`}>
                                            Log in
                                        </button>
                                    </Link>
                                    <Link href="/auth/register">
                                        <button className="px-5 py-2.5 font-medium bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5">
                                            Sign Up Free
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={`p-2 rounded-lg ${logoTextClass}`}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl py-4 flex flex-col border-t border-slate-100 max-h-[calc(100vh-80px)] overflow-y-auto">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`px-6 py-3 font-medium hover:bg-slate-50 ${pathname === link.href ? 'text-green-600 bg-green-50/50' : 'text-slate-700'}`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="px-6 pt-4 mt-2 border-t border-slate-100 flex flex-col gap-3">
                            {loading ? (
                                <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-full"></div>
                            ) : isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-3 py-3 px-2 mb-2 bg-slate-50 rounded-xl">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md text-white text-lg font-bold">
                                            {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{user?.name}</div>
                                            <div className="text-xs text-slate-500">{user?.email}</div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center gap-3 py-3 px-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <Settings className="w-5 h-5 text-slate-400" />
                                        Profile Settings
                                    </Link>
                                    <Link
                                        href="/dashboard/notifications"
                                        className="flex items-center gap-3 py-3 px-4 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        <Bell className="w-5 h-5 text-slate-400" />
                                        Notifications
                                    </Link>

                                    <Link
                                        href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard'}
                                        className="w-full text-center py-3 bg-green-600 rounded-xl text-white font-medium hover:bg-green-700 transition-colors"
                                    >
                                        Go to Dashboard
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full flex justify-center items-center gap-2 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/auth/login" className="w-full text-center py-3 bg-slate-100 rounded-xl text-slate-800 font-medium hover:bg-slate-200 transition-colors">
                                        Log in
                                    </Link>
                                    <Link href="/auth/register" className="w-full text-center py-3 bg-green-500 rounded-xl text-white font-medium shadow-lg shadow-green-500/20 hover:bg-green-600 transition-colors">
                                        Sign Up Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            {/* Add padding top on solid pages to prevent content hiding behind fixed navbar */}
            {isSolidPage && <div className="h-20" />}
        </>
    );
}
