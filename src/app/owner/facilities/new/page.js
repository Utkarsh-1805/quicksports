import AuthGuard from '@/components/auth/AuthGuard';
import AddFacilityForm from '@/components/owner/AddFacilityForm';

export default function NewFacilityPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <AddFacilityForm />
        </AuthGuard>
    );
}
