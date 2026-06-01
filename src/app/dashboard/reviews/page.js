import MyReviewsContent from '@/components/dashboard/MyReviewsContent';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata = {
    title: 'My Reviews',
    description: 'View and manage your reviews on QuickCourt'
};

export default function MyReviewsPage() {
    return (
        <AuthGuard allowedRoles={['USER', 'FACILITY_OWNER', 'ADMIN']}>
            <MyReviewsContent />
        </AuthGuard>
    );
}
