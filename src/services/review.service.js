/**
 * Review & Ratings Service
 * Centralized service for review management, rating aggregation,
 * and moderation features
 */

import { prisma } from "../lib/prisma";

// ==================== RATING CALCULATIONS ====================

/**
 * Calculate venue rating statistics
 * @param {string} facilityId - Venue ID
 * @returns {Object} Rating stats with average, count, and distribution
 */
export async function calculateVenueRating(facilityId) {
  const reviews = await prisma.review.findMany({
    where: { 
      facilityId,
      isApproved: true 
    },
    select: { rating: true }
  });

  if (reviews.length === 0) {
    return {
      averageRating: null,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      weightedScore: null
    };
  }

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  reviews.forEach(review => {
    distribution[review.rating]++;
    totalRating += review.rating;
  });

  const averageRating = totalRating / reviews.length;

  // Wilson Score for confidence-adjusted rating
  // Better for ranking venues with different review counts
  const weightedScore = calculateWilsonScore(reviews.length, averageRating);

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews: reviews.length,
    distribution,
    weightedScore: parseFloat(weightedScore.toFixed(4))
  };
}

/**
 * Wilson Score Lower Bound
 * Provides confidence-adjusted rating for fair venue ranking
 * @param {number} totalReviews - Number of reviews
 * @param {number} averageRating - Average rating (1-5)
 * @returns {number} Confidence-adjusted score
 */
function calculateWilsonScore(totalReviews, averageRating) {
  if (totalReviews === 0) return 0;

  // Convert 5-star to binary (positive = 4-5 stars)
  const z = 1.96; // 95% confidence
  const phat = (averageRating - 1) / 4; // Normalize to 0-1
  const n = totalReviews;

  const score = (phat + z * z / (2 * n) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) 
                / (1 + z * z / n);

  return Math.max(0, score * 4 + 1); // Convert back to 1-5 scale
}

// ==================== REVIEW CRUD ====================

/**
 * Get reviews for a venue with pagination and filtering
 */
export async function getVenueReviews(facilityId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = 'recent',
    includeUnapproved = false,
    withResponses = true
  } = options;

  const skip = (page - 1) * limit;
  
  // Build where clause
  const where = { facilityId };
  if (!includeUnapproved) {
    where.isApproved = true;
  }

  // Determine sort order
  let orderBy;
  switch (sort) {
    case 'highest':
      orderBy = { rating: 'desc' };
      break;
    case 'lowest':
      orderBy = { rating: 'asc' };
      break;
    case 'helpful':
      orderBy = { helpfulCount: 'desc' };
      break;
    case 'recent':
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  // Add verified booking status for each review
  const reviewsWithMeta = await Promise.all(
    reviews.map(async (review) => {
      const hasBooked = await checkUserBookedVenue(review.userId, facilityId);
      return {
        ...review,
        isVerifiedBooking: hasBooked
      };
    })
  );

  return {
    reviews: reviewsWithMeta,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + reviews.length < total
    }
  };
}

/**
 * Check if user has booked a venue (for verified review badge)
 */
export async function checkUserBookedVenue(userId, facilityId) {
  const booking = await prisma.booking.findFirst({
    where: {
      userId,
      court: { facilityId },
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    }
  });
  return !!booking;
}

/**
 * Create a new review
 */
export async function createReview(userId, facilityId, data) {
  const { rating, comment, title } = data;

  // Check if venue exists and is approved
  const venue = await prisma.facility.findFirst({
    where: { id: facilityId, status: 'APPROVED' }
  });

  if (!venue) {
    throw new Error('VENUE_NOT_FOUND');
  }

  // Check if user is the venue owner
  if (venue.ownerId === userId) {
    throw new Error('CANNOT_REVIEW_OWN_VENUE');
  }

  // Check for existing review
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_facilityId: { userId, facilityId }
    }
  });

  if (existingReview) {
    throw new Error('ALREADY_REVIEWED');
  }

  // Check if user has booked this venue
  const hasBooked = await checkUserBookedVenue(userId, facilityId);

  // Auto-approve reviews from verified bookers, others need moderation
  const isApproved = hasBooked;

  const review = await prisma.review.create({
    data: {
      rating,
      comment: comment || null,
      title: title || null,
      userId,
      facilityId,
      isVerifiedBooking: hasBooked,
      isApproved
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return {
    review,
    isVerifiedBooking: hasBooked,
    requiresModeration: !isApproved
  };
}

/**
 * Update a review
 */
export async function updateReview(reviewId, userId, data, isAdmin = false) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  // Check ownership
  if (review.userId !== userId && !isAdmin) {
    throw new Error('UNAUTHORIZED');
  }

  const updateData = {};
  if (data.rating !== undefined) updateData.rating = data.rating;
  if (data.comment !== undefined) updateData.comment = data.comment;
  if (data.title !== undefined) updateData.title = data.title;

  // If user edits their review, it may need re-approval
  if (!isAdmin && review.isApproved && !review.isVerifiedBooking) {
    updateData.isApproved = false;
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return updatedReview;
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId, userId, isAdmin = false) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  // Check ownership
  if (review.userId !== userId && !isAdmin) {
    throw new Error('UNAUTHORIZED');
  }

  await prisma.review.delete({
    where: { id: reviewId }
  });

  return true;
}

// ==================== OWNER RESPONSES ====================

/**
 * Add owner response to a review
 */
export async function addOwnerResponse(reviewId, ownerId, response) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      facility: {
        select: {
          ownerId: true
        }
      }
    }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  // Verify owner
  if (review.facility.ownerId !== ownerId) {
    throw new Error('NOT_VENUE_OWNER');
  }

  // Check if already responded
  if (review.ownerResponse) {
    throw new Error('ALREADY_RESPONDED');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerResponse: response,
      ownerRespondedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  return updatedReview;
}

/**
 * Update owner response
 */
export async function updateOwnerResponse(reviewId, ownerId, response) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      facility: {
        select: {
          ownerId: true
        }
      }
    }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  if (review.facility.ownerId !== ownerId) {
    throw new Error('NOT_VENUE_OWNER');
  }

  if (!review.ownerResponse) {
    throw new Error('NO_RESPONSE_TO_UPDATE');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerResponse: response,
      ownerRespondedAt: new Date()
    }
  });

  return updatedReview;
}

/**
 * Delete owner response
 */
export async function deleteOwnerResponse(reviewId, ownerId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      facility: {
        select: {
          ownerId: true
        }
      }
    }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  if (review.facility.ownerId !== ownerId) {
    throw new Error('NOT_VENUE_OWNER');
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerResponse: null,
      ownerRespondedAt: null
    }
  });

  return true;
}

// ==================== HELPFUL VOTES ====================

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(reviewId, userId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  // Can't mark own review as helpful
  if (review.userId === userId) {
    throw new Error('CANNOT_VOTE_OWN_REVIEW');
  }

  // Check if already voted (stored in JSON array)
  const helpfulVoters = review.helpfulVoters || [];
  if (helpfulVoters.includes(userId)) {
    throw new Error('ALREADY_VOTED');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      helpfulCount: { increment: 1 },
      helpfulVoters: [...helpfulVoters, userId]
    }
  });

  return updatedReview;
}

/**
 * Remove helpful vote
 */
export async function removeHelpfulVote(reviewId, userId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  const helpfulVoters = review.helpfulVoters || [];
  if (!helpfulVoters.includes(userId)) {
    throw new Error('NOT_VOTED');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      helpfulCount: { decrement: 1 },
      helpfulVoters: helpfulVoters.filter(id => id !== userId)
    }
  });

  return updatedReview;
}

// ==================== REVIEW MODERATION ====================

/**
 * Get reviews pending moderation (admin only)
 */
export async function getPendingReviews(options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: false, isFlagged: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit
    }),
    prisma.review.count({
      where: { isApproved: false, isFlagged: false }
    })
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get flagged reviews (admin only)
 */
export async function getFlaggedReviews(options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isFlagged: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { flaggedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.review.count({ where: { isFlagged: true } })
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Approve a review (admin only)
 */
export async function approveReview(reviewId, adminId) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      isApproved: true,
      isFlagged: false,
      flagReason: null,
      moderatedBy: adminId,
      moderatedAt: new Date()
    }
  });

  return updatedReview;
}

/**
 * Reject/remove a review (admin only)
 */
export async function rejectReview(reviewId, adminId, reason) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  // Delete the review
  await prisma.review.delete({
    where: { id: reviewId }
  });

  // Log the action (in production, you'd want an audit log)
  console.log(`Review ${reviewId} rejected by admin ${adminId}. Reason: ${reason}`);

  return true;
}

/**
 * Flag a review for moderation
 */
export async function flagReview(reviewId, userId, reason) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('REVIEW_NOT_FOUND');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      isFlagged: true,
      flagReason: reason,
      flaggedBy: userId,
      flaggedAt: new Date()
    }
  });

  return updatedReview;
}

// ==================== USER REVIEW HISTORY ====================

/**
 * Get all reviews by a user
 */
export async function getUserReviews(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.review.count({ where: { userId } })
  ]);

  // Calculate user's review stats
  const userStats = await prisma.review.aggregate({
    where: { userId },
    _avg: { rating: true },
    _count: { id: true }
  });

  return {
    reviews,
    stats: {
      totalReviews: userStats._count.id,
      averageRating: userStats._avg.rating 
        ? parseFloat(userStats._avg.rating.toFixed(1)) 
        : null
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// ==================== ANALYTICS ====================

/**
 * Get review analytics for admin dashboard
 */
export async function getReviewAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalReviews,
    approvedReviews,
    pendingReviews,
    flaggedReviews,
    last30DaysReviews,
    last7DaysReviews,
    ratingDistribution,
    avgRating,
    topRatedVenues,
    recentReviews
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.review.count({ where: { isApproved: false, isFlagged: false } }),
    prisma.review.count({ where: { isFlagged: true } }),
    prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.review.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.review.groupBy({
      by: ['rating'],
      _count: { rating: true }
    }),
    prisma.review.aggregate({
      where: { isApproved: true },
      _avg: { rating: true }
    }),
    getTopRatedVenues(5),
    prisma.review.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        facility: { select: { id: true, name: true } }
      }
    })
  ]);

  // Format distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach(item => {
    distribution[item.rating] = item._count.rating;
  });

  return {
    overview: {
      totalReviews,
      approvedReviews,
      pendingReviews,
      flaggedReviews,
      approvalRate: totalReviews > 0 
        ? parseFloat(((approvedReviews / totalReviews) * 100).toFixed(1)) 
        : 0
    },
    trends: {
      last7Days: last7DaysReviews,
      last30Days: last30DaysReviews,
      dailyAverage: parseFloat((last30DaysReviews / 30).toFixed(1))
    },
    ratings: {
      average: avgRating._avg.rating 
        ? parseFloat(avgRating._avg.rating.toFixed(2)) 
        : null,
      distribution
    },
    topRatedVenues,
    recentReviews
  };
}

/**
 * Get top rated venues
 */
export async function getTopRatedVenues(limit = 10) {
  const venues = await prisma.facility.findMany({
    where: { status: 'APPROVED' },
    include: {
      reviews: {
        where: { isApproved: true },
        select: { rating: true }
      },
      _count: {
        select: { reviews: true }
      }
    }
  });

  // Calculate ratings and sort
  const venuesWithRatings = venues
    .map(venue => {
      const approvedReviews = venue.reviews;
      const totalReviews = approvedReviews.length;
      
      if (totalReviews === 0) return null;

      const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
      const wilsonScore = calculateWilsonScore(totalReviews, avgRating);

      return {
        id: venue.id,
        name: venue.name,
        city: venue.city,
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews,
        wilsonScore
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.wilsonScore - a.wilsonScore)
    .slice(0, limit);

  return venuesWithRatings;
}

/**
 * Get venue owner's review summary
 */
export async function getOwnerReviewSummary(ownerId) {
  const facilities = await prisma.facility.findMany({
    where: { ownerId },
    include: {
      reviews: {
        where: { isApproved: true },
        select: { rating: true }
      }
    }
  });

  let totalReviews = 0;
  let totalRating = 0;
  const venueStats = [];

  for (const facility of facilities) {
    const reviews = facility.reviews;
    const count = reviews.length;
    totalReviews += count;

    if (count > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;
      totalRating += avg * count;
      
      venueStats.push({
        venueId: facility.id,
        venueName: facility.name,
        averageRating: parseFloat(avg.toFixed(2)),
        totalReviews: count
      });
    }
  }

  const overallAverage = totalReviews > 0 
    ? parseFloat((totalRating / totalReviews).toFixed(2)) 
    : null;

  return {
    overallAverage,
    totalReviews,
    totalVenues: facilities.length,
    venueStats: venueStats.sort((a, b) => b.averageRating - a.averageRating)
  };
}
