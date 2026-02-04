/**
 * Flag Review API
 * POST /api/venues/[id]/reviews/[reviewId]/flag - Flag a review for moderation
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../../../lib/auth";
import { flagReview } from "../../../../../../../services/review.service";
import { flagReviewSchema } from "../../../../../../../validations/review.validation";

/**
 * POST - Flag a review for moderation
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
    const validation = flagReviewSchema.safeParse(body);
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

    const { reason, details } = validation.data;
    const fullReason = details ? `${reason}: ${details}` : reason;

    const review = await flagReview(reviewId, user.id, fullReason);

    return NextResponse.json({
      success: true,
      message: 'Review flagged for moderation. Our team will review it shortly.',
      data: { 
        reviewId: review.id,
        isFlagged: review.isFlagged
      }
    });

  } catch (error) {
    console.error('Flag review error:', error);

    if (error.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to flag review' },
      { status: 500 }
    );
  }
}
