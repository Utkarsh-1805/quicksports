'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Star,
    ChevronRight,
    Loader2,
    AlertCircle,
    MessageSquare,
    MapPin,
    Reply,
    Edit3,
    Trash2,
    Calendar,
    User,
    ChevronDown,
    X,
    Check,
    Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/contexts/ApiContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});

const getInitials = (name) => {
    if (!name) return 'CU';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

function StarRow({ rating }) {
    const filled = Math.round(rating);
    return (
        <div className="flex items-center text-secondary-container">
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= filled ? 'text-secondary-container' : 'text-outline-variant'}>
                    <Icon name="star" size={20} filled={i <= filled} />
                </span>
            ))}
        </div>
    );
}

function OwnerReviewCard({ review, onRespond, onUpdateResponse, onDeleteResponse }) {
    const [showResponseForm, setShowResponseForm] = useState(false);
    const [responseText, setResponseText] = useState(review.ownerResponse || '');
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const venueId = review.venueId || review.facilityId || review.facility?.id;

    const handleSubmit = async () => {
        if (!responseText.trim()) return;

        setSubmitting(true);
        try {
            if (review.ownerResponse) {
                await onUpdateResponse(venueId, review.id, responseText);
            } else {
                await onRespond(venueId, review.id, responseText);
            }
            setShowResponseForm(false);
            setIsEditing(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this response?')) return;

        setSubmitting(true);
        try {
            await onDeleteResponse(venueId, review.id);
            setResponseText('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card card-hover p-6 flex flex-col gap-4">
            {/* Header - Avatar + User + Rating */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="avatar w-12 h-12 text-sm bg-primary-container text-on-primary-container shrink-0">
                        {getInitials(review.user?.name)}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-semibold text-on-surface truncate">{review.user?.name || 'Customer'}</h4>
                        <p className="text-sm text-on-surface-variant truncate">
                            <Link href={`/venues/${review.venueId}`} className="hover:text-primary transition-colors">
                                {review.venue?.name || 'Venue'}
                            </Link>
                            {' • '}<span className="font-mono">{formatDate(review.createdAt)}</span>
                        </p>
                    </div>
                </div>
                <StarRow rating={review.rating} />
            </div>

            {/* Review Body */}
            <p className="text-on-surface mt-2 leading-relaxed">
                {review.comment || <em className="text-outline">No comment provided</em>}
            </p>

            {/* Existing Response */}
            {review.ownerResponse && !isEditing ? (
                <div className="mt-2 pt-4 border-t border-outline-variant/40">
                    <div className="flex gap-3 items-start bg-primary-container text-on-primary-container p-4 rounded-2xl border-l-[3px] border-primary">
                        <Icon name="storefront" size={20} className="mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold mb-1">Response from Management</h5>
                            <p className="text-sm">{review.ownerResponse}</p>
                            <div className="flex justify-start gap-3 mt-3">
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowResponseForm(true);
                                    }}
                                    className="text-sm font-medium hover:underline flex items-center gap-1"
                                >
                                    <Icon name="edit" size={16} />
                                    Edit Reply
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={submitting}
                                    className="text-error text-sm font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                                >
                                    {submitting ? <Icon name="progress_activity" size={16} className="animate-spin" /> : <Icon name="delete" size={16} />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Response Form */}
            {showResponseForm || isEditing ? (
                <div className="mt-2 pt-4 border-t border-outline-variant/40">
                    <div className="flex gap-3 items-start">
                        <Icon name="subdirectory_arrow_right" size={20} className="text-outline mt-2 shrink-0" />
                        <div className="flex-1">
                            <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-on-surface-variant mb-1.5">
                                {isEditing ? 'Edit your response' : 'Write a professional reply'}
                            </label>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={3}
                                className="input resize-none text-sm"
                                placeholder="Thank the customer for their review or address their concerns..."
                            />
                            <div className="flex items-center justify-end gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        setShowResponseForm(false);
                                        setIsEditing(false);
                                        setResponseText(review.ownerResponse || '');
                                    }}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !responseText.trim()}
                                    className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Icon name="progress_activity" size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="check" size={16} />
                                            {isEditing ? 'Update Reply' : 'Post Reply'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Reply CTA */}
            {!review.ownerResponse && !showResponseForm && (
                <div className="mt-2 pt-4 border-t border-outline-variant/40">
                    <button
                        onClick={() => setShowResponseForm(true)}
                        className="btn btn-outline btn-sm"
                    >
                        <Icon name="reply" size={16} />
                        Respond to review
                    </button>
                </div>
            )}
        </div>
    );
}

function ReviewCardSkeleton() {
    return (
        <div className="card p-6 animate-pulse">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-surface-container" />
                    <div className="flex-1">
                        <div className="h-5 bg-surface-container rounded w-2/3 mb-2" />
                        <div className="h-4 bg-surface-container/50 rounded w-1/2" />
                    </div>
                </div>
                <div className="h-5 bg-surface-container rounded w-24" />
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-surface-container/50 rounded w-full" />
                <div className="h-4 bg-surface-container/50 rounded w-4/5" />
            </div>
        </div>
    );
}

export default function OwnerReviewsContent() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { owner: ownerApi, review: reviewApi } = useApi();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [filter, setFilter] = useState('all'); // all, responded, unresponded
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [ratingDistribution, setRatingDistribution] = useState(null);

    const filters = [
        { value: 'all', label: 'All Reviews' },
        { value: 'unresponded', label: 'Needs Response' },
        { value: 'responded', label: 'Responded' }
    ];

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/owner/reviews');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchReviews();
    }, [user, authLoading, filter]);

    const fetchReviews = async (page = 1) => {
        setLoading(true);
        setError(null);

        try {
            const params = { page, limit: 10 };
            if (filter === 'responded') params.hasResponse = true;
            if (filter === 'unresponded') params.hasResponse = false;

            const { success, data, error: apiError } = await ownerApi.getReviews(params);

            if (success && data) {
                setReviews(data.reviews || []);
                setPagination({
                    page: data.pagination?.page || 1,
                    totalPages: data.pagination?.totalPages || 1,
                    total: data.pagination?.total || 0
                });
                // Real distribution from API (computed across ALL reviews server-side)
                if (data.ratingDistribution) {
                    setRatingDistribution({
                        ...data.ratingDistribution,
                        averageRating: data.averageRating
                    });
                }
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

    const formatApiError = (apiError, errors, fallback) => {
        const fieldErrors = errors && typeof errors === 'object'
            ? Object.values(errors).flat().filter(Boolean).join(' ')
            : '';
        return fieldErrors || apiError || fallback;
    };

    const handleRespond = async (venueId, reviewId, response) => {
        try {
            const { success, error: apiError, errors } = await reviewApi.addResponse(venueId, reviewId, response);

            if (success) {
                setReviews(prev => prev.map(r =>
                    r.id === reviewId ? { ...r, ownerResponse: response } : r
                ));
            } else {
                alert(formatApiError(apiError, errors, 'Failed to add response'));
            }
        } catch (err) {
            alert('Failed to add response');
        }
    };

    const handleUpdateResponse = async (venueId, reviewId, response) => {
        try {
            const { success, error: apiError, errors } = await reviewApi.updateResponse(venueId, reviewId, response);

            if (success) {
                setReviews(prev => prev.map(r =>
                    r.id === reviewId ? { ...r, ownerResponse: response } : r
                ));
            } else {
                alert(formatApiError(apiError, errors, 'Failed to update response'));
            }
        } catch (err) {
            alert('Failed to update response');
        }
    };

    const handleDeleteResponse = async (venueId, reviewId) => {
        try {
            const { success, error: apiError } = await reviewApi.deleteResponse(venueId, reviewId);

            if (success) {
                setReviews(prev => prev.map(r =>
                    r.id === reviewId ? { ...r, ownerResponse: null } : r
                ));
            } else {
                alert(apiError || 'Failed to delete response');
            }
        } catch (err) {
            alert('Failed to delete response');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center">
                <div className="text-center">
                    <Icon name="progress_activity" size={48} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-on-surface-variant">Loading...</p>
                </div>
            </div>
        );
    }

    // Aggregate stats — prefer API-provided fields (computed over all reviews server-side),
    // fall back to current page if the API doesn't yet return them.
    const totalReviews = pagination.total || reviews.length;
    const apiAverage = typeof ratingDistribution?.averageRating === 'number'
        ? ratingDistribution.averageRating
        : null;
    const pageAverage = reviews.length
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;
    const averageRating = apiAverage ?? pageAverage;

    const apiDist = ratingDistribution && typeof ratingDistribution === 'object' && !Array.isArray(ratingDistribution)
        ? ratingDistribution
        : null;
    const histogram = [5, 4, 3, 2, 1].map((star) => {
        const count = apiDist
            ? (apiDist[star] || 0)
            : reviews.filter((r) => Math.round(r.rating) === star).length;
        const denom = apiDist ? totalReviews : reviews.length;
        const pct = denom ? Math.round((count / denom) * 100) : 0;
        return { star, count, pct };
    });

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header & Filters */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 mb-8">
                    <div>
                        <p className="eyebrow mb-2">Reviews</p>
                        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-on-surface tracking-tight">Reviews</h1>
                        <p className="text-on-surface-variant mt-2 max-w-2xl">
                            Manage player feedback and respond to reviews across your facilities.
                        </p>
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="btn btn-outline btn-sm"
                        >
                            <Icon name="filter_list" size={18} />
                            {filters.find(f => f.value === filter)?.label}
                            <Icon name="expand_more" size={18} />
                        </button>
                        {showFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                                <div className="absolute right-0 mt-2 w-48 card p-1 z-20">
                                    {filters.map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => {
                                                setFilter(f.value);
                                                setShowFilterMenu(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm rounded-lg hover:bg-surface-container transition-colors ${filter === f.value ? 'text-primary font-semibold bg-primary-container/10' : 'text-on-surface'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Overview Card */}
                {!loading && reviews.length > 0 && (
                    <section className="card p-8 flex flex-col md:flex-row gap-12 items-center mb-8">
                        <div className="flex flex-col items-center justify-center min-w-[200px]">
                            <div className="font-display font-mono text-6xl leading-none font-semibold text-on-surface tracking-tighter">
                                {averageRating.toFixed(1)}
                            </div>
                            <div className="flex items-center gap-1 mt-3 mb-2">
                                <StarRow rating={averageRating} />
                            </div>
                            <p className="text-sm text-on-surface-variant">Based on <span className="font-mono text-on-surface font-semibold">{totalReviews.toLocaleString()}</span> reviews</p>
                        </div>
                        <div className="w-px h-32 bg-outline-variant/50 hidden md:block" />
                        <div className="flex-1 w-full flex flex-col gap-3">
                            {histogram.map((row) => (
                                <div key={row.star} className="flex items-center gap-4">
                                    <span className="font-mono text-sm text-on-surface w-4 text-right">{row.star}</span>
                                    <Icon name="star" size={18} filled className="text-secondary-container" />
                                    <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary-container rounded-full transition-all" style={{ width: `${row.pct}%` }} />
                                    </div>
                                    <span className="font-mono text-sm text-on-surface-variant w-12 text-right">{row.count}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-error-container text-on-error-container rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <Icon name="error" size={20} className="text-error shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Reviews List */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <ReviewCardSkeleton key={i} />
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16 card">
                        <Icon name="reviews" size={64} className="text-outline-variant mx-auto mb-4" />
                        <h3 className="font-display text-xl font-semibold text-on-surface mb-2">No reviews yet</h3>
                        <p className="text-on-surface-variant">
                            {filter === 'unresponded'
                                ? 'All reviews have been responded to!'
                                : 'Reviews from your customers will appear here.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-6">
                            {reviews.map((review) => (
                                <OwnerReviewCard
                                    key={review.id}
                                    review={review}
                                    onRespond={handleRespond}
                                    onUpdateResponse={handleUpdateResponse}
                                    onDeleteResponse={handleDeleteResponse}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8 pb-12">
                                <button
                                    onClick={() => fetchReviews(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon name="chevron_left" size={20} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                                        const page = idx + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => fetchReviews(page)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold font-mono text-sm transition-colors ${
                                                    pagination.page === page
                                                        ? 'bg-primary text-on-primary shadow-sm'
                                                        : 'border border-outline-variant text-on-surface hover:bg-surface-container-high'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => fetchReviews(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon name="chevron_right" size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
