'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import UserManagementContent from '@/components/admin/UserManagementContent';

export default function UsersPage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <UserManagementContent />
        </AuthGuard>
    );
}
