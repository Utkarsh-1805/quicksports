/**
 * Filter Options API
 * GET /api/venues/filters - Get available filter options for search UI
 */

import { NextResponse } from "next/server";
import { getFilterOptions } from "@/services/search.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    const filters = await getFilterOptions(city);

    return NextResponse.json({
      success: true,
      message: "Filter options fetched successfully",
      data: filters
    });

  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
