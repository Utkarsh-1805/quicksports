'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import RevenueManagementContent from '@/components/admin/RevenueManagementContent';

export default function RevenuePage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <RevenueManagementContent />
        </AuthGuard>
    );
}
