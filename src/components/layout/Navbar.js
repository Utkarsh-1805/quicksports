'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import { NotificationBell } from '@/components/ui/NotificationBell';

export function Navbar() {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [prevPathname, setPrevPathname] = useState(pathname);
    const [scrolled, setScrolled] = useState(false);
    const userMenuRef = useRef(null);

    const isAuthPage = pathname?.startsWith('/auth');

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (userMenuOpen) setUserMenuOpen(false);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (isAuthPage) return null;

    const getNavLinks = () => {
        if (!isAuthenticated) {
            return [
                { name: 'Find a Court', href: '/venues' },
                { name: 'Find a Match', href: '/matches' },
                { name: 'For Owners', href: '/owner/dashboard' },
                { name: 'About', href: '/about' },
            ];
        }
        if (user?.role === 'ADMIN') {
            return [
                { name: 'Console', href: '/admin' },
                { name: 'Approvals', href: '/admin/approvals' },
                { name: 'Users', href: '/admin/users' },
                { name: 'Revenue', href: '/admin/revenue' },
            ];
        }
        if (user?.role === 'FACILITY_OWNER') {
            return [
                { name: 'Dashboard', href: '/owner/dashboard' },
                { name: 'Facilities', href: '/owner/facilities' },
                { name: 'Bookings', href: '/owner/bookings' },
                { name: 'Earnings', href: '/owner/earnings' },
            ];
        }
        return [
            { name: 'Find a Court', href: '/venues' },
            { name: 'Matches', href: '/matches' },
            { name: 'My Bookings', href: '/dashboard/bookings' },
            { name: 'Dashboard', href: '/dashboard' },
        ];
    };

    const navLinks = getNavLinks();

    const isActiveLink = (href) => {
        if (href === '/venues') return pathname === '/venues' || pathname === '/';
        return pathname === href;
    };

    return (
        <nav className={`sticky top-0 z-50 w-full transition-colors duration-200 ${scrolled ? 'navbar-scrolled' : 'bg-transparent'}`}>
            <div className="flex justify-between items-center px-container-margin h-[72px] w-full max-w-7xl mx-auto">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2.5 text-on-surface">
                        <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-display text-lg font-bold tracking-tight">
                            Q
                        </span>
                        <span className="font-display text-[22px] font-bold tracking-tight">QuickCourt</span>
                    </Link>
                    <div className="hidden md:flex gap-7 text-sm">
                        {navLinks.map((link) => {
                            const active = isActiveLink(link.href);
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`py-1.5 font-medium transition-colors border-b-2 ${
                                        active
                                            ? 'text-secondary-container border-secondary-container'
                                            : 'text-on-surface border-transparent hover:text-primary'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3 text-base">
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="btn btn-ghost btn-sm !p-2"
                    >
                        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={18} />
                    </button>

                    {isAuthenticated && <NotificationBell />}

                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse" />
                    ) : isAuthenticated ? (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 font-medium text-on-surface hover:opacity-80 transition-opacity"
                            >
                                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-sm font-semibold">
                                    {user?.name?.charAt(0).toUpperCase() || <Icon name="person" size={18} />}
                                </div>
                                <span className="text-sm">{user?.name?.split(' ')[0]}</span>
                                <Icon name="expand_more" size={18} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-60 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant py-2 z-50">
                                    <div className="px-4 py-3 border-b border-outline-variant">
                                        <p className="font-semibold text-on-surface">{user?.name}</p>
                                        <p className="text-sm text-on-surface-variant truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        {user?.role === 'ADMIN' ? (
                                            <DropdownLink href="/admin" icon="shield" label="Admin Console" />
                                        ) : user?.role === 'FACILITY_OWNER' ? (
                                            <>
                                                <DropdownLink href="/owner/dashboard" icon="dashboard" label="Dashboard" />
                                                <DropdownLink href="/owner/facilities" icon="domain" label="Facilities" />
                                            </>
                                        ) : (
                                            <>
                                                <DropdownLink href="/dashboard" icon="dashboard" label="Dashboard" />
                                                <DropdownLink href="/dashboard/bookings" icon="event" label="My Bookings" />
                                            </>
                                        )}
                                        <DropdownLink href="/dashboard/notifications" icon="notifications" label="Notifications" />
                                        <DropdownLink href="/dashboard/profile" icon="settings" label="Settings" />
                                    </div>
                                    <div className="border-t border-outline-variant pt-1">
                                        <button
                                            onClick={() => { setUserMenuOpen(false); logout(); }}
                                            className="flex items-center gap-3 px-4 py-2.5 text-error hover:bg-error-container/30 w-full text-sm"
                                        >
                                            <Icon name="logout" size={18} /> Log out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/auth/login" className="btn btn-ghost btn-sm">
                                Login
                            </Link>
                            <Link href="/auth/register" className="btn btn-primary btn-sm">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex md:hidden items-center gap-1">
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="btn btn-ghost btn-sm !p-2"
                    >
                        <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={18} />
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg text-on-surface"
                        aria-label="Toggle menu"
                    >
                        <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden bg-surface border-t border-outline-variant py-4">
                    <div className="px-container-margin flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const active = isActiveLink(link.href);
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-4 py-3 rounded-lg font-medium ${
                                        active ? 'text-secondary bg-surface-container' : 'text-on-surface hover:bg-surface-container-low'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}

                        <div className="mt-3 pt-3 border-t border-outline-variant flex flex-col gap-2">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard'}
                                        className="w-full text-center py-3 rounded-full bg-primary text-on-primary font-semibold"
                                    >
                                        Go to Dashboard
                                    </Link>
                                    <button onClick={logout} className="w-full flex justify-center items-center gap-2 py-3 text-error font-medium hover:bg-error-container/30 rounded-lg">
                                        <Icon name="logout" size={18} /> Log out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/auth/login" className="w-full text-center py-3 rounded-full text-on-surface font-medium border border-outline-variant">
                                        Login
                                    </Link>
                                    <Link href="/auth/register" className="w-full text-center py-3 rounded-full bg-primary text-on-primary font-semibold">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

function DropdownLink({ href, icon, label }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-2.5 text-on-surface hover:bg-surface-container-low text-sm">
            <Icon name={icon} size={18} className="text-on-surface-variant" />
            {label}
        </Link>
    );
}
