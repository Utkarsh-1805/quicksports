'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import OwnerAnalyticsContent from '@/components/owner/OwnerAnalyticsContent';

export default function OwnerAnalyticsPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <OwnerAnalyticsContent />
        </AuthGuard>
    );
}
