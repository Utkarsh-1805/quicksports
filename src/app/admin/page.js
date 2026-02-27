'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import AdminDashboardContent from '@/components/admin/AdminDashboardContent';

export default function AdminDashboardPage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <AdminDashboardContent />
        </AuthGuard>
    );
}
