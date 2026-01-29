import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { verifyAuthToken } from "../../../../../lib/auth";
import { 
  validateReview, 
  validateReviewQuery,
  createReviewSchema 
} from "../../../../../validations/review.validation";

// GET /api/venues/[id]/reviews - Get all reviews for a venue
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validation = validateReviewQuery(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const { page, limit, sort } = validation.data;
    const skip = (page - 1) * limit;
    
    // Check if venue exists
    const venue = await prisma.facility.findFirst({
      where: { id, status: 'APPROVED' }
    });
    
    if (!venue) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }
    
    // Determine sort order
    let orderBy = { createdAt: 'desc' };
    if (sort === 'highest') orderBy = { rating: 'desc' };
    if (sort === 'lowest') orderBy = { rating: 'asc' };
    
    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { facilityId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.review.count({ where: { facilityId: id } })
    ]);
    
    // Calculate rating distribution
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      where: { facilityId: id },
      _count: { rating: true }
    });
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingStats.forEach(stat => {
      ratingDistribution[stat.rating] = stat._count.rating;
    });
    
    // Calculate average rating
    const avgRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : null;
    
    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats: {
          total,
          averageRating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
          distribution: ratingDistribution
        },
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + reviews.length < total
        }
      }
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reviews' },
      { status: 500 }
    );
  }
}

// POST /api/venues/[id]/reviews - Create a review (authenticated users only)
export async function POST(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validation = validateReview(body, createReviewSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const { rating, comment } = validation.data;
    
    // Check if venue exists and is approved
    const venue = await prisma.facility.findFirst({
      where: { id, status: 'APPROVED' }
    });
    
    if (!venue) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the venue owner (can't review own venue)
    if (venue.ownerId === user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot review your own venue' },
        { status: 403 }
      );
    }
    
    // Check if user already reviewed this venue
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_facilityId: {
          userId: user.id,
          facilityId: id
        }
      }
    });
    
    if (existingReview) {
      return NextResponse.json(
        { success: false, message: 'You have already reviewed this venue. Use PUT to update.' },
        { status: 409 }
      );
    }
    
    // Check if user has booked this venue before (optional - for verified reviews)
    const hasBooked = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        court: { facilityId: id },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    });
    
    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        userId: user.id,
        facilityId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        review,
        isVerifiedBooking: !!hasBooked
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
