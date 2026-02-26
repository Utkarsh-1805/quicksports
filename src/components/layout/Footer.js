'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-2 pr-8">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center group-hover:bg-green-400 transition-colors">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight group-hover:text-green-50 transition-colors">QuickCourt</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6 max-w-sm">
                            The modern platform for sports enthusiasts to discover, book, and play at premium facilities everywhere.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Discover</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/venues" className="hover:text-green-400 transition-colors block">Venues</Link></li>
                            <li><Link href="/sports" className="hover:text-green-400 transition-colors block">Sports</Link></li>
                            <li><Link href="/cities" className="hover:text-green-400 transition-colors block">Cities</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/about" className="hover:text-green-400 transition-colors block">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-green-400 transition-colors block">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-green-400 transition-colors block">Blog</Link></li>
                            <li><Link href="/contact" className="hover:text-green-400 transition-colors block">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Partners</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/partners" className="hover:text-green-400 transition-colors block">List Your Court</Link></li>
                            <li><Link href="/auth/register" className="hover:text-green-400 transition-colors block">Owner App</Link></li>
                            <li><Link href="/pricing" className="hover:text-green-400 transition-colors block">Pricing</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p>© {new Date().getFullYear()} QuickCourt Technologies. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
