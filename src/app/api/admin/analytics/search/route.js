/**
 * Admin Search Analytics API
 * GET /api/admin/analytics/search - Get search and inventory analytics
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSearchAnalytics } from "@/services/search.service";

export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    // Verify admin access
    const adminCheck = await isAdmin(authResult.user.id);
    if (!adminCheck) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const analytics = await getSearchAnalytics();

    return NextResponse.json({
      success: true,
      message: "Search analytics fetched successfully",
      data: analytics
    });

  } catch (error) {
    console.error("Error fetching search analytics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch search analytics" },
      { status: 500 }
    );
  }
}
