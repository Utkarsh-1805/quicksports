/**
 * Owner Response API
 * POST /api/venues/[id]/reviews/[reviewId]/response - Add owner response
 * PUT /api/venues/[id]/reviews/[reviewId]/response - Update owner response
 * DELETE /api/venues/[id]/reviews/[reviewId]/response - Delete owner response
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../../../lib/auth";
import {
  addOwnerResponse,
  updateOwnerResponse,
  deleteOwnerResponse
} from "../../../../../../../services/review.service";
import { ownerResponseSchema } from "../../../../../../../validations/review.validation";

/**
 * POST - Add owner response to a review
 */
export async function POST(request, context) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const params = await context.params;
    const { reviewId } = params;
    const body = await request.json();

    // Validate input
    const validation = ownerResponseSchema.safeParse(body);
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

    // Only facility owners can respond
    if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only venue owners can respond to reviews' },
        { status: 403 }
      );
    }

    const review = await addOwnerResponse(
      reviewId,
      user.id,
      validation.data.response
    );

    return NextResponse.json({
      success: true,
      message: 'Response added successfully',
      data: { review }
    }, { status: 201 });

  } catch (error) {
    console.error('Add owner response error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    if (error.message === 'NOT_VENUE_OWNER') {
      return NextResponse.json(
        { success: false, message: 'You can only respond to reviews on your venues' },
        { status: 403 }
      );
    }

    if (error.message === 'ALREADY_RESPONDED') {
      return NextResponse.json(
        { success: false, message: 'You have already responded to this review. Use PUT to update.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to add response', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update owner response
 */
export async function PUT(request, context) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const params = await context.params;
    const { reviewId } = params;
    const body = await request.json();

    // Validate input
    const validation = ownerResponseSchema.safeParse(body);
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

    const review = await updateOwnerResponse(
      reviewId,
      user.id,
      validation.data.response
    );

    return NextResponse.json({
      success: true,
      message: 'Response updated successfully',
      data: { review }
    });

  } catch (error) {
    console.error('Update owner response error:', error);

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    if (error.message === 'NOT_VENUE_OWNER') {
      return NextResponse.json(
        { success: false, message: 'You can only update responses on your venues' },
        { status: 403 }
      );
    }

    if (error.message === 'NO_RESPONSE_TO_UPDATE') {
      return NextResponse.json(
        { success: false, message: 'No response found to update. Use POST to create.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update response' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete owner response
 */
export async function DELETE(request, context) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const params = await context.params;
    const { reviewId } = params;

    await deleteOwnerResponse(reviewId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Response deleted successfully'
    });

  } catch (error) {
    console.error('Delete owner response error:', error);

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    if (error.message === 'NOT_VENUE_OWNER') {
      return NextResponse.json(
        { success: false, message: 'You can only delete responses on your venues' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to delete response' },
      { status: 500 }
    );
  }
}
