import AuthGuard from '@/components/auth/AuthGuard';
import OwnerDashboardContent from '@/components/owner/OwnerDashboardContent';

export default function OwnerDashboardPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <OwnerDashboardContent />
        </AuthGuard>
    );
}
