/**
 * Helpful Vote API
 * POST /api/venues/[id]/reviews/[reviewId]/helpful - Mark review as helpful
 * DELETE /api/venues/[id]/reviews/[reviewId]/helpful - Remove helpful vote
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../../../lib/auth";
import {
  markReviewHelpful,
  removeHelpfulVote
} from "../../../../../../../services/review.service";

/**
 * POST - Mark review as helpful
 */
export async function POST(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { reviewId } = await params;

    const review = await markReviewHelpful(reviewId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Marked as helpful',
      data: { 
        helpfulCount: review.helpfulCount 
      }
    });

  } catch (error) {
    console.error('Mark helpful error:', error);

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    if (error.message === 'CANNOT_VOTE_OWN_REVIEW') {
      return NextResponse.json(
        { success: false, message: 'You cannot mark your own review as helpful' },
        { status: 400 }
      );
    }

    if (error.message === 'ALREADY_VOTED') {
      return NextResponse.json(
        { success: false, message: 'You have already marked this review as helpful' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to mark as helpful' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove helpful vote
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { reviewId } = await params;

    const review = await removeHelpfulVote(reviewId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Helpful vote removed',
      data: { 
        helpfulCount: review.helpfulCount 
      }
    });

  } catch (error) {
    console.error('Remove helpful vote error:', error);

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    if (error.message === 'NOT_VOTED') {
      return NextResponse.json(
        { success: false, message: 'You have not marked this review as helpful' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
