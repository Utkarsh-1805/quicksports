import OwnerReviewsContent from '@/components/owner/OwnerReviewsContent';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata = {
    title: 'Customer Reviews',
    description: 'Manage and respond to customer reviews on QuickCourt'
};

export default function OwnerReviewsPage() {
    return (
        <AuthGuard allowedRoles={['FACILITY_OWNER', 'ADMIN']}>
            <OwnerReviewsContent />
        </AuthGuard>
    );
}
