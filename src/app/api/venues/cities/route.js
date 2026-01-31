/**
 * Featured Cities API
 * GET /api/venues/cities - Get featured cities with venue counts
 */

import { NextResponse } from "next/server";
import { getFeaturedCities } from "@/services/search.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, message: "Limit must be between 1 and 50" },
        { status: 400 }
      );
    }

    const cities = await getFeaturedCities(limit);

    return NextResponse.json({
      success: true,
      message: "Featured cities fetched successfully",
      data: {
        cities,
        total: cities.length
      }
    });

  } catch (error) {
    console.error("Error fetching featured cities:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch featured cities" },
      { status: 500 }
    );
  }
}
