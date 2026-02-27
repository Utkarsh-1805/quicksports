import AuthGuard from '@/components/auth/AuthGuard';
import FacilitiesContent from '@/components/owner/FacilitiesContent';

export default function FacilitiesPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <FacilitiesContent />
        </AuthGuard>
    );
}
