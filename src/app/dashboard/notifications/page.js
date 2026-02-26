import AuthGuard from '@/components/auth/AuthGuard';
import NotificationsContent from '@/components/dashboard/NotificationsContent';

export const metadata = {
    title: 'Notifications | QuickCourt',
    description: 'View and manage your notifications'
};

export default function NotificationsPage() {
    return (
        <AuthGuard allowedRoles={['USER']}>
            <NotificationsContent />
        </AuthGuard>
    );
}
