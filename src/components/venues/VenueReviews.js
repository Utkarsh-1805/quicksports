'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

// Mock utility functions for formatting dates
function abbreviateDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

export function VenueReviews({ venueId, initialStats }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, getToken } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(initialStats || { total: 0, averageRating: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
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

    // Fetch reviews initially and on load-more
    const fetchReviews = async (page = 1) => {
        setIsLoading(true);
        setIsError(false);

        try {
            const res = await fetch(`/api/venues/${venueId}/reviews?page=${page}&limit=${pagination.limit}`);
            if (!res.ok) throw new Error('Failed to fetch reviews');

            const data = await res.json();

            if (page === 1) {
                setReviews(data.data.reviews);
                setStats(data.data.stats); // Use exact backend stats calculation
            } else {
                setReviews(prev => [...prev, ...data.data.reviews]);
            }

            setPagination(data.data.pagination);
        } catch (error) {
            console.error(error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(1);
    }, [venueId]);

    useEffect(() => {
        if (searchParams.get('writeReview') === '1') {
            setShowReviewForm(true);
        }
    }, [searchParams]);

    const loadMore = () => {
        if (pagination.hasMore && !isLoading) {
            fetchReviews(pagination.page + 1);
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedRating || submitLoading) return;

        setSubmitLoading(true);
        setSubmitError('');

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                router.push(`/auth/login?redirect=/venues/${venueId}`);
                return;
            }

            const res = await fetch(`/api/venues/${venueId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: selectedRating,
                    comment: reviewComment.trim() || null
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setSubmitError(data.message || 'Failed to submit review');
                return;
            }

            // Reset form
            setShowReviewForm(false);
            setSelectedRating(0);
            setHoverRating(0);
            setReviewComment('');

            // Refresh latest reviews and stats
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: editRating,
                    comment: editComment.trim() || null
                })
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
            <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm text-center">
                <p className="text-red-500 font-medium tracking-wide">Could not load reviews at this time.</p>
                <button onClick={() => fetchReviews(1)} className="mt-4 text-slate-500 underline hover:text-slate-800">Try Again</button>
            </div>
        );
    }

    // Calculate percentages for the distribution bars
    const totalReviews = stats.total > 0 ? stats.total : 1; // Prevent division by zero

    return (
        <div className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-100 shadow-xl" id="reviews-section">
            <div className="flex flex-col md:flex-row gap-12 items-start">

                {/* Left Stats Column */}
                <div className="w-full md:w-1/3 shrink-0">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Reviews</h2>
                    <p className="text-slate-500 mb-8">Real opinions from athletes like you.</p>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center text-4xl font-black text-green-600 shadow-inner">
                            {stats.averageRating ? stats.averageRating.toFixed(1) : '—'}
                        </div>
                        <div>
                            <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= (stats.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-slate-500 font-medium">Based on {stats.total} reviews</p>
                        </div>
                    </div>

                    {/* Distribution Bars */}
                    <div className="space-y-3 mb-10">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.distribution[rating] || 0;
                            const percentage = Math.round((count / totalReviews) * 100);
                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <span className="font-bold text-slate-700 w-3">{rating}</span>
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 w-8 text-right shrink-0">{percentage}%</span>
                                </div>
                            );
                        })}
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        onClick={() => {
                            setShowReviewForm((prev) => !prev);
                            setSubmitError('');
                        }}
                    >
                        {showReviewForm ? 'Close Review Form' : 'Write a Review'}
                    </Button>

                    {showReviewForm && (
                        <div className="mt-5 p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800 mb-2">Your Rating</p>
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
                                            <Star
                                                className={`w-7 h-7 transition-colors ${
                                                    star <= (hoverRating || selectedRating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-slate-300 fill-slate-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-800 mb-2 block">Comment (optional)</label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={4}
                                    placeholder="Tell others about your experience..."
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            {submitError && (
                                <p className="text-sm text-red-600">{submitError}</p>
                            )}

                            <Button
                                fullWidth
                                onClick={handleSubmitReview}
                                disabled={!selectedRating || submitLoading}
                            >
                                {submitLoading ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Comments Column */}
                <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-slate-100 pt-10 md:pt-0 md:pl-12">

                    {reviews.length === 0 && !isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No reviews yet</h3>
                            <p className="text-slate-500 max-w-sm">Be the first to share your experience exploring this venue.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {reviews.map((review) => (
                                <div key={review.id} className="pb-8 border-b border-slate-100 last:border-0">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center uppercase tracking-wider">
                                                {review.user?.name ? review.user.name.charAt(0) : <User className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{review.user?.name || 'Anonymous User'}</h4>
                                                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                                                    {abbreviateDate(review.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            {canEditReview(review) && editingReviewId !== review.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => startEditReview(review)}
                                                    className="text-xs font-medium text-green-600 hover:text-green-700"
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
                                                        <Star
                                                            className={`w-5 h-5 ${star <= (editHoverRating || editRating)
                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                : 'text-slate-300 fill-slate-300'
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />

                                            {editError && (
                                                <p className="text-sm text-red-600">{editError}</p>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => saveEditedReview(review)}
                                                    disabled={!editRating || editLoading}
                                                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {editLoading ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditReview}
                                                    disabled={editLoading}
                                                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 leading-relaxed pl-16">
                                            {review.comment || 'No written comment supplied.'}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Load More */}
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-green-500 animate-spin" />
                        </div>
                    )}

                    {pagination.hasMore && !isLoading && (
                        <div className="flex justify-center pt-8 border-t border-slate-100 mt-8">
                            <button
                                onClick={loadMore}
                                className="font-medium text-green-600 hover:text-green-700 transition-colors border border-green-200 hover:border-green-300 hover:bg-green-50 px-6 py-2.5 rounded-full"
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
