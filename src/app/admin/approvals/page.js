'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import FacilityApprovalsContent from '@/components/admin/FacilityApprovalsContent';

export default function ApprovalsPage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <FacilityApprovalsContent />
        </AuthGuard>
    );
}
