import AuthGuard from '@/components/auth/AuthGuard';
import FacilityDetailContent from '@/components/owner/FacilityDetailContent';

export default function FacilityDetailPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <FacilityDetailContent />
        </AuthGuard>
    );
}
