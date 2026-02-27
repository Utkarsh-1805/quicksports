'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ModerationContent from '@/components/admin/ModerationContent';

export default function ModerationPage() {
    return (
        <AuthGuard allowedRoles={['ADMIN']}>
            <ModerationContent />
        </AuthGuard>
    );
}
