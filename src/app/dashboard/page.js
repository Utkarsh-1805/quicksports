import AuthGuard from '@/components/auth/AuthGuard';
import UserDashboardContent from '@/components/dashboard/UserDashboardContent';

export const metadata = {
    title: 'Dashboard | QuickCourt',
    description: 'View your bookings, stats, and manage your QuickCourt account'
};

export default function DashboardPage() {
    return (
        <AuthGuard allowedRoles={['USER']}>
            <UserDashboardContent />
        </AuthGuard>
    );
}
