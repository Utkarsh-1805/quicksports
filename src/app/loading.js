import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 animate-pulse">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-slate-500 font-medium">Loading...</p>
            </div>
        </div>
    );
}
