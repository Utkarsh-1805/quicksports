/**
 * Venue Rating Stats API
 * GET /api/venues/[id]/rating - Get venue rating statistics
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { calculateVenueRating } from "../../../../../services/review.service";

/**
 * GET - Get venue rating statistics
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Check if venue exists
    const venue = await prisma.facility.findFirst({
      where: { id, status: 'APPROVED' },
      select: {
        id: true,
        name: true
      }
    });

    if (!venue) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }

    const ratingStats = await calculateVenueRating(id);

    return NextResponse.json({
      success: true,
      data: {
        venue: {
          id: venue.id,
          name: venue.name
        },
        ratings: ratingStats
      }
    });

  } catch (error) {
    console.error('Get venue rating error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load rating statistics' },
      { status: 500 }
    );
  }
}
