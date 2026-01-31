/**
 * Similar Venues API
 * GET /api/venues/:id/similar - Get venues similar to a specific venue
 */

import { NextResponse } from "next/server";
import { getSimilarVenues } from "@/services/search.service";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 5;

    // Validate limit
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { success: false, message: "Limit must be between 1 and 20" },
        { status: 400 }
      );
    }

    // Check if venue exists
    const venue = await prisma.facility.findUnique({
      where: { id },
      select: { id: true, name: true }
    });

    if (!venue) {
      return NextResponse.json(
        { success: false, message: "Venue not found" },
        { status: 404 }
      );
    }

    const similarVenues = await getSimilarVenues(id, limit);

    return NextResponse.json({
      success: true,
      message: "Similar venues fetched successfully",
      data: {
        referenceVenue: venue.name,
        venues: similarVenues
      }
    });

  } catch (error) {
    console.error("Error fetching similar venues:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch similar venues" },
      { status: 500 }
    );
  }
}
