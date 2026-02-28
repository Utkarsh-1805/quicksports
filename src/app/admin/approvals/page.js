import AuthGuard from '@/components/auth/AuthGuard';
import FacilityApprovalsContent from '@/components/admin/FacilityApprovalsContent';

export const dynamic = 'force-dynamic';

export default function ApprovalsPage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <FacilityApprovalsContent />
        </AuthGuard>
    );
}
