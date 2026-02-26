import AuthGuard from '@/components/auth/AuthGuard';

export default function OwnerDashboardPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER']}>
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Owner Dashboard</h1>
                    <p className="text-slate-500">Welcome to your Facility Management dashboard.</p>
                </div>
            </div>
        </AuthGuard>
    );
}
