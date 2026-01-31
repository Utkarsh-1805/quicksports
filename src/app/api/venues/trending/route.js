/**
 * Trending & Popular Venues API
 * GET /api/venues/trending - Get trending venues
 */

import { NextResponse } from "next/server";
import { getTrendingVenues, getPopularSports } from "@/services/search.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit')) || 10;
    const city = searchParams.get('city');
    const sportType = searchParams.get('sportType');
    const includeSports = searchParams.get('includeSports') === 'true';

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { success: false, message: "Limit must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Get trending venues
    const venues = await getTrendingVenues({ limit, city, sportType });

    // Optionally get popular sports
    let popularSports = null;
    if (includeSports) {
      popularSports = await getPopularSports(city);
    }

    return NextResponse.json({
      success: true,
      message: "Trending venues fetched successfully",
      data: {
        venues,
        ...(popularSports && { popularSports })
      }
    });

  } catch (error) {
    console.error("Error fetching trending venues:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch trending venues" },
      { status: 500 }
    );
  }
}
