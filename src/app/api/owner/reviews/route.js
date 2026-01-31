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

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        unrespondedCount,
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
