/**
 * Admin Individual Review Management API
 * GET /api/admin/reviews/[id] - Get single review details
 * PUT /api/admin/reviews/[id] - Moderate a review (approve/reject)
 * DELETE /api/admin/reviews/[id] - Delete a review
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { prisma } from "../../../../../lib/prisma";
import {
  approveReview,
  rejectReview
} from "../../../../../services/review.service";
import { moderationSchema } from "../../../../../validations/review.validation";

/**
 * GET - Get single review details for admin
 */
export async function GET(request, { params }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            city: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    // Get user's booking history for this venue
    const userBookings = await prisma.booking.count({
      where: {
        userId: review.userId,
        court: { facilityId: review.facilityId },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    // Get user's review history
    const userReviewCount = await prisma.review.count({
      where: { userId: review.userId }
    });

    return NextResponse.json({
      success: true,
      data: {
        review,
        context: {
          userBookingsAtVenue: userBookings,
          totalUserReviews: userReviewCount,
          isVerifiedBooker: userBookings > 0
        }
      }
    });

  } catch (error) {
    console.error('Admin get review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load review' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Moderate a review (approve or reject)
 */
export async function PUT(request, { params }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const admin = adminResult.user;
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = moderationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { action, reason } = validation.data;

    if (action === 'APPROVE') {
      const review = await approveReview(id, admin.id);
      return NextResponse.json({
        success: true,
        message: 'Review approved successfully',
        data: { review }
      });
    }

    if (action === 'REJECT') {
      if (!reason) {
        return NextResponse.json(
          { success: false, message: 'Reason is required for rejection' },
          { status: 400 }
        );
      }
      
      await rejectReview(id, admin.id, reason);
      return NextResponse.json({
        success: true,
        message: 'Review rejected and removed'
      });
    }

  } catch (error) {
    console.error('Admin moderate review error:', error);

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to moderate review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a review (admin force delete)
 */
export async function DELETE(request, { params }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    await prisma.review.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Admin delete review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
