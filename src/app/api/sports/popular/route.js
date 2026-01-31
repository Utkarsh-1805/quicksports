/**
 * Popular Sports API
 * GET /api/sports/popular - Get popular sports with booking statistics
 */

import { NextResponse } from "next/server";
import { getPopularSports } from "@/services/search.service";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    const popularSports = await getPopularSports(city);

    return NextResponse.json({
      success: true,
      message: "Popular sports fetched successfully",
      data: {
        sports: popularSports,
        city: city || 'All Cities'
      }
    });

  } catch (error) {
    console.error("Error fetching popular sports:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch popular sports" },
      { status: 500 }
    );
  }
}
