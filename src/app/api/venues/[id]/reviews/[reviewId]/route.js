import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { verifyAuthToken } from "../../../../../../lib/auth";
import { validateReview, updateReviewSchema } from "../../../../../../validations/review.validation";

// GET /api/venues/[id]/reviews/[reviewId] - Get single review
export async function GET(request, { params }) {
  try {
    const { id, reviewId } = await params;
    
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        facilityId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true
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
    
    return NextResponse.json({
      success: true,
      data: { review }
    });
    
  } catch (error) {
    console.error('Get review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load review' },
      { status: 500 }
    );
  }
}

// PUT /api/venues/[id]/reviews/[reviewId] - Update review (owner only)
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    const { id, reviewId } = await params;
    const body = await request.json();
    
    // Validate input
    const validation = validateReview(body, updateReviewSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }
    
    // Find the review
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        facilityId: id
      }
    });
    
    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Check ownership (only review author or admin can update)
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only update your own reviews' },
        { status: 403 }
      );
    }
    
    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: validation.data.rating ?? review.rating,
        comment: validation.data.comment !== undefined ? validation.data.comment : review.comment
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
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });
    
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/venues/[id]/reviews/[reviewId] - Delete review (owner or admin)
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    const { id, reviewId } = await params;
    
    // Find the review
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        facilityId: id
      }
    });
    
    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Check ownership (only review author or admin can delete)
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }
    
    // Delete review
    await prisma.review.delete({
      where: { id: reviewId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
