/**
 * Admin Review Management API
 * GET /api/admin/reviews - Get all reviews with filters
 * GET /api/admin/reviews/analytics - Get review analytics
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin";
import { prisma } from "../../../../lib/prisma";
import {
  getPendingReviews,
  getFlaggedReviews,
  getReviewAnalytics
} from "../../../../services/review.service";
import { validateAdminReviewQuery } from "../../../../validations/review.validation";

/**
 * GET - Get all reviews with filters for admin
 */
export async function GET(request) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check for analytics request
    const isAnalytics = searchParams.get('analytics') === 'true';
    if (isAnalytics) {
      const analytics = await getReviewAnalytics();
      return NextResponse.json({
        success: true,
        data: analytics
      });
    }

    // Validate query params
    const validation = validateAdminReviewQuery(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters', errors: validation.errors },
        { status: 400 }
      );
    }

    const { page, limit, status, venueId, userId, minRating, maxRating } = validation.data;
    const skip = (page - 1) * limit;

    // Handle special status filters
    if (status === 'pending') {
      const result = await getPendingReviews({ page, limit });
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    if (status === 'flagged') {
      const result = await getFlaggedReviews({ page, limit });
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    // Build where clause for general queries
    const where = {};
    
    if (status === 'approved') {
      where.isApproved = true;
    }
    
    if (venueId) {
      where.facilityId = venueId;
    }
    
    if (userId) {
      where.userId = userId;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) where.rating.gte = minRating;
      if (maxRating !== undefined) where.rating.lte = maxRating;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
              name: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin get reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reviews' },
      { status: 500 }
    );
  }
}
