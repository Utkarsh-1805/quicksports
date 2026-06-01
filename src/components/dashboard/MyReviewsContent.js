'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';
import { Icon } from '@/components/ui/Icon';

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});

function StarRow({ rating = 0, size = 20 }) {
    return (
        <div className="flex text-secondary-container">
            {[1, 2, 3, 4, 5].map((i) => (
                <Icon
                    key={i}
                    name="star"
                    filled={i <= rating}
                    size={size}
                    className={i <= rating ? 'text-secondary-container' : 'text-outline-variant'}
                />
            ))}
        </div>
    );
}

function ReviewCard({ review, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        setDeleting(true);
        await onDelete(review.id, review.venueId);
        setDeleting(false);
    };

    return (
        <div className="card card-hover p-[22px] flex flex-col">
            {/* Venue Info & Rating */}
            <div className="flex justify-between items-start gap-4 mb-4">
                <Link href={`/venues/${review.venueId}`} className="flex-1 min-w-0 group">
                    <h4 className="font-display text-xl font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {review.venue?.name || 'Venue'}
                    </h4>
                    <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1 font-mono">
                        <Icon name="location_on" size={14} />
                        {review.venue?.city}{review.venue?.state ? `, ${review.venue.state}` : ''}
                    </p>
                </Link>
                <StarRow rating={review.rating} size={16} />
            </div>

            {/* Review Content */}
            <p className="text-base text-on-surface mb-6 flex-1 leading-relaxed">
                {review.comment || <em className="text-on-surface-variant">No comment provided</em>}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Icon name="calendar_today" size={16} />
                    {formatDate(review.createdAt)}
                    {review.updatedAt !== review.createdAt && (
                        <span className="text-on-surface-variant opacity-70">(edited)</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/venues/${review.venueId}/write-review?edit=${review.id}`}>
                        <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/10 rounded-lg transition-colors">
                            <Icon name="edit" size={16} />
                        </button>
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors disabled:opacity-50"
                    >
                        {deleting ? (
                            <Icon name="progress_activity" size={16} className="animate-spin" />
                        ) : (
                            <Icon name="delete" size={16} />
                        )}
                    </button>
                </div>
            </div>

            {/* Owner Response */}
            {review.ownerResponse && (
                <div className="mt-4 bg-surface-container-low border-l-4 border-primary rounded-r-xl p-4 relative">
                    <Icon
                        name="format_quote"
                        size={20}
                        className="absolute top-3 right-3 text-outline-variant opacity-50"
                    />
                    <p className="text-sm font-medium text-primary mb-1">Response from {review.venue?.name || 'Venue'}</p>
                    <p className="text-sm text-on-surface-variant">{review.ownerResponse}</p>
                </div>
            )}
        </div>
    );
}

function ReviewCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 animate-pulse">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <div className="h-6 bg-surface-container rounded w-2/3 mb-2" />
                    <div className="h-4 bg-surface-container-low rounded w-1/3" />
                </div>
                <div className="h-6 bg-surface-container rounded w-32" />
            </div>
            <div className="space-y-2 mb-4">
                <div className="h-4 bg-surface-container-low rounded w-full" />
                <div className="h-4 bg-surface-container-low rounded w-4/5" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <div className="h-4 bg-surface-container-low rounded w-24" />
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-surface-container-low rounded-lg" />
                    <div className="h-8 w-8 bg-surface-container-low rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export default function MyReviewsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { user: userApi, review: reviewApi } = useApi();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('my-reviews');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/dashboard/reviews');
            return;
        }

        fetchReviews();
    }, [user, authLoading]);

    const fetchReviews = async (page = 1) => {
        setLoading(true);
        setError(null);

        try {
            const { success, data, error: apiError } = await userApi.getMyReviews({ page, limit: 10 });

            if (success && data) {
                setReviews(data.reviews || []);
                setPagination({
                    page: data.pagination?.page || 1,
                    totalPages: data.pagination?.totalPages || 1,
                    total: data.pagination?.total || 0
                });
            } else {
                throw new Error(apiError || 'Failed to load reviews');
            }
        } catch (err) {
            console.error('Fetch reviews error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId, venueId) => {
        try {
            const { success, error: apiError } = await reviewApi.deleteReview(venueId, reviewId);

            if (success) {
                setReviews(prev => prev.filter(r => r.id !== reviewId));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            } else {
                alert(apiError || 'Failed to delete review');
            }
        } catch (err) {
            alert('Failed to delete review');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface pt-28 pb-12 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="progress_activity" size={40} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-on-surface-variant">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-24 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                        <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        <Icon name="chevron_right" size={16} />
                        <span className="text-on-surface">My Reviews</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-semibold text-on-surface tracking-tight mb-2">My reviews</h1>
                    <p className="text-on-surface-variant">
                        {pagination.total} review{pagination.total !== 1 ? 's' : ''} written
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-outline-variant mb-12 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('my-reviews')}
                        className={`tab ${activeTab === 'my-reviews' ? 'active' : ''}`}
                    >
                        My reviews
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    >
                        Pending reviews
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-error-container border border-error/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <Icon name="error" size={20} className="text-error shrink-0" />
                        <p className="text-on-error-container">{error}</p>
                    </div>
                )}

                {/* Pending Reviews Tab */}
                {activeTab === 'pending' && (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mx-auto mb-4">
                            <Icon name="rate_review" size={40} className="text-on-secondary-container" />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-on-surface mb-2">Pending reviews</h3>
                        <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
                            Completed bookings that are awaiting your feedback will appear here. Visit your bookings to review past venues.
                        </p>
                        <Link href="/dashboard/bookings" className="btn btn-cta">
                            <Icon name="calendar_today" size={16} />
                            View bookings
                        </Link>
                    </div>
                )}

                {/* Reviews List */}
                {activeTab === 'my-reviews' && (
                    loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <ReviewCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="card text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                                <Icon name="forum" size={40} className="text-on-surface-variant" />
                            </div>
                            <h3 className="font-display text-xl font-semibold text-on-surface mb-2">No reviews yet</h3>
                            <p className="text-on-surface-variant mb-6">
                                You haven&apos;t written any reviews yet.<br />
                                Book a court and share your experience!
                            </p>
                            <Link href="/venues" className="btn btn-cta">Browse venues</Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {reviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        onDelete={handleDeleteReview}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-8">
                                    <button
                                        onClick={() => fetchReviews(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-4 py-2 text-sm font-medium rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm text-on-surface-variant">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchReviews(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-4 py-2 text-sm font-medium rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )
                )}
            </div>
        </div>
    );
}
