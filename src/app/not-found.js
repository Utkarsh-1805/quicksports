import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* 404 Illustration */}
                <div className="mb-8">
                    <div className="relative">
                        <span className="text-[150px] sm:text-[200px] font-bold text-slate-100 select-none">
                            404
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-50 flex items-center justify-center">
                                <Search className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                    Page Not Found
                </h1>
                <p className="text-slate-500 mb-8 text-lg">
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
                    >
                        <Home className="w-5 h-5" />
                        Go to Home
                    </Link>
                    <Link
                        href="/venues"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Search className="w-5 h-5" />
                        Browse Venues
                    </Link>
                </div>

                {/* Back link */}
                <button 
                    onClick={() => typeof window !== 'undefined' && window.history.back()}
                    className="inline-flex items-center gap-2 mt-8 text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go back to previous page
                </button>
            </div>
        </div>
    );
}
