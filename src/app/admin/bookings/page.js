'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import GlobalBookingsContent from '@/components/admin/GlobalBookingsContent';

export default function AdminBookingsPage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <GlobalBookingsContent />
        </AuthGuard>
    );
}
