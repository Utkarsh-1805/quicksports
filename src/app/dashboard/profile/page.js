import AuthGuard from '@/components/auth/AuthGuard';
import ProfileContent from '@/components/dashboard/ProfileContent';

export const metadata = {
    title: 'Profile Settings | QuickCourt',
    description: 'Manage your profile, security settings, and notification preferences'
};

export default function ProfilePage() {
    return (
        <AuthGuard allowedRoles={['USER']}>
            <ProfileContent />
        </AuthGuard>
    );
}
