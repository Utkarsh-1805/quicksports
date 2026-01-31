/**
 * NOTIFICATION COUNT/STATS API
 * =============================
 * 
 * GET /api/notifications/count - Get unread notification count
 * 
 * Quick endpoint for getting unread count (for badges, etc.)
 * 
 * @module api/notifications/count
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { getNotificationStats } from "../../../../services/notification.service";

/**
 * GET /api/notifications/count - Get notification counts
 * 
 * Returns unread count and basic stats for UI badges/indicators
 * 
 * @requires Authentication
 */
export async function GET(request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Get notification stats
    const stats = await getNotificationStats(userId);

    // Return minimal or detailed response
    if (detailed) {
      return NextResponse.json({
        success: true,
        data: {
          unread: stats.unread,
          total: stats.total,
          read: stats.read,
          byType: stats.byType
        }
      });
    }

    // Minimal response for badge count
    return NextResponse.json({
      success: true,
      data: {
        unread: stats.unread
      }
    });

  } catch (error) {
    console.error('Get notification count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification count' },
      { status: 500 }
    );
  }
}
