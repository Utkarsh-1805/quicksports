import OwnerEarningsContent from '@/components/owner/OwnerEarningsContent';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata = {
    title: 'Earnings',
    description: 'View and manage your earnings on QuickCourt'
};

export default function OwnerEarningsPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <OwnerEarningsContent />
        </AuthGuard>
    );
}
