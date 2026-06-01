'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

const FOOTER_COLUMNS = [
    { title: 'Product', items: [
        { label: 'Find a Court', href: '/venues' },
        { label: 'Open Matches', href: '/matches' },
        { label: 'Map View', href: '/venues/map' },
        { label: 'Mobile App', href: '#' },
    ]},
    { title: 'For Owners', items: [
        { label: 'List your venue', href: '/owner/facilities/new' },
        { label: 'Owner dashboard', href: '/owner/dashboard' },
        { label: 'Pricing', href: '#' },
        { label: 'Partner program', href: '#' },
    ]},
    { title: 'Resources', items: [
        { label: 'Help center', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Community guidelines', href: '#' },
        { label: 'Refund policy', href: '#' },
    ]},
    { title: 'Company', items: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Terms · Privacy', href: '#' },
    ]},
];

export function Footer() {
    const pathname = usePathname();

    if (pathname?.startsWith('/auth')) return null;

    return (
        <footer className="mt-16 border-t border-outline-variant bg-surface-container-low">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-14">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-x-8 gap-y-10">
                    {/* Brand column — wider */}
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4 lg:pr-8">
                        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 text-on-surface">
                            <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-display text-base font-bold">
                                Q
                            </span>
                            <span className="font-display text-xl font-bold">QuickCourt</span>
                        </Link>
                        <p className="text-sm leading-relaxed text-on-surface-variant max-w-[260px]">
                            Book premium sports venues in seconds. Built for athletes.
                        </p>
                    </div>

                    {/* Link columns — each 2/12 on desktop */}
                    {FOOTER_COLUMNS.map((col) => (
                        <div key={col.title} className="lg:col-span-2">
                            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-4">
                                {col.title}
                            </div>
                            <ul className="flex flex-col gap-3 list-none p-0 m-0">
                                {col.items.map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-on-surface hover:text-primary transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap mt-12 pt-6 border-t border-outline-variant">
                    <span className="font-mono text-xs text-on-surface-variant">
                        © {new Date().getFullYear()} QuickCourt Sports · Built for athletes
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1.5">
                        <Icon name="sports_score" size={14} className="text-primary" />
                        10,247 matches played this week
                    </span>
                </div>
            </div>
        </footer>
    );
}
