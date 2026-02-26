import AuthGuard from '@/components/auth/AuthGuard';
import MyBookingsContent from '@/components/dashboard/MyBookingsContent';

export const metadata = {
    title: 'My Bookings | QuickCourt',
    description: 'View and manage all your court bookings'
};

export default function MyBookingsPage() {
    return (
        <AuthGuard allowedRoles={['USER']}>
            <MyBookingsContent />
        </AuthGuard>
    );
}
