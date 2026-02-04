/**
 * User Reviews API
 * GET /api/users/me/reviews - Get current user's review history
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../lib/auth";
import { getUserReviews } from "../../../../../services/review.service";

/**
 * GET - Get user's own review history
 */
export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    const result = await getUserReviews(user.id, { page, limit });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reviews' },
      { status: 500 }
    );
  }
}
