/**
 * Owner Reviews Summary API
 * GET /api/owner/reviews - Get all reviews across owner's venues
 * GET /api/owner/reviews/summary - Get owner's review summary
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getOwnerReviewSummary } from "../../../../services/review.service";

/**
 * GET - Get reviews across owner's venues or summary
 */
export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Only facility owners can access this
    if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Facility owners only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isSummary = searchParams.get('summary') === 'true';
    
    // Return summary if requested
    if (isSummary) {
      const summary = await getOwnerReviewSummary(user.id);
      return NextResponse.json({
        success: true,
        data: summary
      });
    }

    // Otherwise return paginated reviews
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const venueId = searchParams.get('venueId');
    const unrespondedOnly = searchParams.get('unrespondedOnly') === 'true';
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      facility: { ownerId: user.id }
    };

    if (venueId) {
      where.facilityId = venueId;
    }

    if (unrespondedOnly) {
      where.ownerResponse = null;
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
          },
          facility: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    // Count unresponded reviews
    const unrespondedCount = await prisma.review.count({
      where: {
        facility: { ownerId: user.id },
        ownerResponse: null,
        isApproved: true
      }
    });

    // Compute rating distribution over ALL reviews matching `where` (not just current page)
    const ratingGroups = await prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true }
    });

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    let ratingCount = 0;
    for (const group of ratingGroups) {
      const r = group.rating;
      const c = group._count.rating;
      if (r >= 1 && r <= 5) {
        ratingDistribution[r] = c;
        ratingSum += r * c;
        ratingCount += c;
      }
    }
    const averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        unrespondedCount,
        ratingDistribution,
        averageRating,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get owner reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reviews' },
      { status: 500 }
    );
  }
}
