'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';

function abbreviateDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options).toUpperCase();
}

export function VenueReviews({ venueId, initialStats }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, getToken } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(
        initialStats || { total: 0, averageRating: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    );
    const [pagination, setPagination] = useState({ page: 1, limit: 5, hasMore: false });
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editHoverRating, setEditHoverRating] = useState(0);
    const [editComment, setEditComment] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    const fetchReviews = async (page = 1) => {
        setIsLoading(true);
        setIsError(false);
        try {
            const token = getToken?.();
            const res = await fetch(`/api/venues/${venueId}/reviews?page=${page}&limit=${pagination.limit}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Failed to fetch reviews');
            const data = await res.json();
            if (page === 1) {
                setReviews(data.data.reviews);
                setStats(data.data.stats);
            } else {
                setReviews((prev) => [...prev, ...data.data.reviews]);
            }
            setPagination(data.data.pagination);
        } catch (error) {
            console.error(error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleHelpful = async (review) => {
        if (!user) {
            router.push(`/auth/login?redirect=/venues/${venueId}`);
            return;
        }
        // Owner cannot vote on their own review
        if (review.user?.id === user.id) return;

        const willVote = !review.userHasVoted;
        // Optimistic update
        setReviews((prev) =>
            prev.map((r) =>
                r.id === review.id
                    ? { ...r, userHasVoted: willVote, helpfulCount: Math.max(0, (r.helpfulCount || 0) + (willVote ? 1 : -1)) }
                    : r
            )
        );
        try {
            const token = getToken?.();
            const res = await fetch(`/api/venues/${venueId}/reviews/${review.id}/helpful`, {
                method: willVote ? 'POST' : 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                // Roll back on failure
                setReviews((prev) =>
                    prev.map((r) =>
                        r.id === review.id
                            ? { ...r, userHasVoted: !willVote, helpfulCount: Math.max(0, (r.helpfulCount || 0) + (willVote ? -1 : 1)) }
                            : r
                    )
                );
            }
        } catch (err) {
            console.error('Toggle helpful error:', err);
        }
    };

    useEffect(() => {
        fetchReviews(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [venueId]);

    useEffect(() => {
        if (searchParams.get('writeReview') === '1') setShowReviewForm(true);
    }, [searchParams]);

    const loadMore = () => {
        if (pagination.hasMore && !isLoading) fetchReviews(pagination.page + 1);
    };

    const handleSubmitReview = async () => {
        if (!selectedRating || submitLoading) return;
        setSubmitLoading(true);
        setSubmitError('');
        try {
            const token = document.cookie
                .split('; ')
                .find((row) => row.startsWith('quickcourt_token='))
                ?.split('=')[1];
            if (!token) {
                router.push(`/auth/login?redirect=/venues/${venueId}`);
                return;
            }
            const res = await fetch(`/api/venues/${venueId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating: selectedRating, comment: reviewComment.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setSubmitError(data.message || 'Failed to submit review');
                return;
            }
            setShowReviewForm(false);
            setSelectedRating(0);
            setHoverRating(0);
            setReviewComment('');
            await fetchReviews(1);
        } catch (error) {
            console.error('Submit review error:', error);
            setSubmitError('Failed to submit review. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const canEditReview = (review) => {
        if (!user) return false;
        return user.role === 'ADMIN' || review.user?.id === user.id;
    };

    const startEditReview = (review) => {
        setEditingReviewId(review.id);
        setEditRating(review.rating || 0);
        setEditHoverRating(0);
        setEditComment(review.comment || '');
        setEditError('');
    };

    const cancelEditReview = () => {
        setEditingReviewId(null);
        setEditRating(0);
        setEditHoverRating(0);
        setEditComment('');
        setEditError('');
    };

    const saveEditedReview = async (review) => {
        if (!editRating || editLoading) return;
        setEditLoading(true);
        setEditError('');
        try {
            const token = getToken?.();
            if (!token) {
                router.push(`/auth/login?redirect=/venues/${venueId}`);
                return;
            }
            const res = await fetch(`/api/venues/${venueId}/reviews/${review.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating: editRating, comment: editComment.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setEditError(data.message || 'Failed to update review');
                return;
            }
            cancelEditReview();
            await fetchReviews(1);
        } catch (error) {
            console.error('Edit review error:', error);
            setEditError('Failed to update review. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    if (isError) {
        return (
            <div className="card p-8 border-error/40 text-center">
                <p className="text-error font-medium">Could not load reviews at this time.</p>
                <button
                    onClick={() => fetchReviews(1)}
                    className="mt-4 text-on-surface-variant underline hover:text-on-surface"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const totalReviews = stats.total > 0 ? stats.total : 1;

    return (
        <div
            className="card p-8 lg:p-10"
            id="reviews-section"
        >
            <div className="flex flex-col md:flex-row gap-12 items-start">
                {/* Left stats column */}
                <div className="w-full md:w-1/3 shrink-0">
                    <h2 className="font-display text-3xl text-on-surface tracking-tight mb-2">Reviews</h2>
                    <p className="text-on-surface-variant mb-8">Real opinions from athletes like you.</p>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center font-display text-4xl text-on-primary-container">
                            {stats.averageRating ? stats.averageRating.toFixed(1) : '—'}
                        </div>
                        <div>
                            <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Icon
                                        key={star}
                                        name="star"
                                        filled={star <= (stats.averageRating || 0)}
                                        size={20}
                                        className={star <= (stats.averageRating || 0) ? 'text-secondary-container' : 'text-outline-variant'}
                                    />
                                ))}
                            </div>
                            <p className="text-on-surface-variant font-medium">Based on {stats.total} reviews</p>
                        </div>
                    </div>

                    {/* Distribution bars */}
                    <div className="space-y-3 mb-10">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.distribution[rating] || 0;
                            const percentage = Math.round((count / totalReviews) * 100);
                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-on-surface w-3">{rating}</span>
                                    <Icon name="star" filled size={16} className="text-secondary-container shrink-0" />
                                    <div className="flex-1 h-2.5 bg-surface-container rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-secondary-container rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="font-mono text-xs font-medium text-on-surface-variant w-8 text-right shrink-0">
                                        {percentage}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => {
                            setShowReviewForm((prev) => !prev);
                            setSubmitError('');
                        }}
                        className="btn btn-primary w-full"
                    >
                        <Icon name={showReviewForm ? 'close' : 'edit'} size={18} />
                        {showReviewForm ? 'Close Review Form' : 'Write a Review'}
                    </button>

                    {showReviewForm && (
                        <div className="mt-5 p-4 rounded-[20px] border border-outline-variant bg-surface-container-low space-y-4 anim-fade">
                            <div>
                                <p className="text-sm font-semibold text-on-surface mb-2">Your Rating</p>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setSelectedRating(star)}
                                            className="p-1"
                                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                        >
                                            <Icon
                                                name="star"
                                                filled={star <= (hoverRating || selectedRating)}
                                                size={28}
                                                className={star <= (hoverRating || selectedRating) ? 'text-secondary-container' : 'text-outline-variant'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-on-surface mb-2 block">Comment (optional)</label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={4}
                                    placeholder="Tell others about your experience..."
                                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            {submitError && <p className="text-sm text-error">{submitError}</p>}

                            <button
                                onClick={handleSubmitReview}
                                disabled={!selectedRating || submitLoading}
                                className="btn btn-cta w-full disabled:opacity-50"
                            >
                                {submitLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right comments column */}
                <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-outline-variant pt-10 md:pt-0 md:pl-12">
                    {reviews.length === 0 && !isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                                <Icon name="forum" size={32} className="text-outline" />
                            </div>
                            <h3 className="font-display text-xl text-on-surface mb-2">No reviews yet</h3>
                            <p className="text-on-surface-variant max-w-sm">
                                Be the first to share your experience exploring this venue.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {reviews.map((review) => (
                                <div key={review.id} className="pb-8 border-b border-outline-variant last:border-0">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container font-bold flex items-center justify-center uppercase text-base">
                                                {review.user?.name ? review.user.name.charAt(0) : <Icon name="person" size={24} />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-on-surface">
                                                    {review.user?.name || 'Anonymous User'}
                                                </h4>
                                                <span className="font-mono text-xs font-medium text-on-surface-variant tracking-wider">
                                                    {abbreviateDate(review.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Icon
                                                        key={star}
                                                        name="star"
                                                        filled={star <= review.rating}
                                                        size={16}
                                                        className={star <= review.rating ? 'text-secondary-container' : 'text-outline-variant'}
                                                    />
                                                ))}
                                            </div>
                                            {canEditReview(review) && editingReviewId !== review.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => startEditReview(review)}
                                                    className="text-xs font-medium text-primary hover:text-primary-container"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {editingReviewId === review.id ? (
                                        <div className="pl-16 space-y-3">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onMouseEnter={() => setEditHoverRating(star)}
                                                        onMouseLeave={() => setEditHoverRating(0)}
                                                        onClick={() => setEditRating(star)}
                                                        className="p-1"
                                                        aria-label={`Set rating ${star}`}
                                                    >
                                                        <Icon
                                                            name="star"
                                                            filled={star <= (editHoverRating || editRating)}
                                                            size={20}
                                                            className={star <= (editHoverRating || editRating) ? 'text-secondary-container' : 'text-outline-variant'}
                                                        />
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                                rows={3}
                                                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            />

                                            {editError && <p className="text-sm text-error">{editError}</p>}

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => saveEditedReview(review)}
                                                    disabled={!editRating || editLoading}
                                                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
                                                >
                                                    {editLoading ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditReview}
                                                    disabled={editLoading}
                                                    className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-on-surface-variant leading-relaxed pl-16">
                                                {review.comment || 'No written comment supplied.'}
                                            </p>
                                            <div className="pl-16 mt-3 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHelpful(review)}
                                                    disabled={user && review.user?.id === user.id}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                                        review.userHasVoted
                                                            ? 'bg-primary-container text-on-primary-container border-primary-container'
                                                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container hover:text-on-surface'
                                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    title={user && review.user?.id === user.id ? "You can't vote on your own review" : 'Mark this review as helpful'}
                                                >
                                                    <Icon name="thumb_up" filled={review.userHasVoted} size={14} />
                                                    <span>Helpful</span>
                                                    {typeof review.helpfulCount === 'number' && review.helpfulCount > 0 && (
                                                        <span className="font-mono">{review.helpfulCount}</span>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
                        </div>
                    )}

                    {pagination.hasMore && !isLoading && (
                        <div className="flex justify-center pt-8 border-t border-outline-variant mt-8">
                            <button
                                onClick={loadMore}
                                className="btn btn-outline btn-sm"
                            >
                                Read More Reviews
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
