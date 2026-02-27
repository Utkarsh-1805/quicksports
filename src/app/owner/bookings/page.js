'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import OwnerBookingsContent from '@/components/owner/OwnerBookingsContent';

export default function OwnerBookingsPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <OwnerBookingsContent />
        </AuthGuard>
    );
}
