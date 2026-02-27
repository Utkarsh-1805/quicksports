'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
            <div className="text-center max-w-lg">
                {/* Error Icon */}
                <div className="mb-8">
                    <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                    Something went wrong
                </h1>
                <p className="text-slate-500 mb-8 text-lg">
                    We apologize for the inconvenience. An unexpected error has occurred.
                </p>

                {/* Error details in development */}
                {process.env.NODE_ENV === 'development' && error && (
                    <div className="mb-8 text-left">
                        <details className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <summary className="cursor-pointer text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Bug className="w-4 h-4" />
                                Error Details (Development Only)
                            </summary>
                            <div className="mt-3 text-xs font-mono text-red-600 overflow-auto max-h-40">
                                <p className="font-semibold">{error.message}</p>
                                {error.digest && (
                                    <p className="mt-2 text-slate-500">Digest: {error.digest}</p>
                                )}
                            </div>
                        </details>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Go to Home
                    </Link>
                </div>

                {/* Support text */}
                <p className="mt-8 text-sm text-slate-400">
                    If this problem persists, please contact our support team.
                </p>
            </div>
        </div>
    );
}
