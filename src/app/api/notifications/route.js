/**
 * USER NOTIFICATIONS API
 * =======================
 * 
 * GET  /api/notifications - Get user notifications
 * PUT  /api/notifications - Mark all as read
 * DELETE /api/notifications - Delete all read notifications
 * 
 * @module api/notifications
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../lib/auth";
import { 
  getUserNotifications, 
  markAllAsRead, 
  deleteReadNotifications,
  getNotificationStats
} from "../../../services/notification.service";

/**
 * GET /api/notifications - Get user notifications
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 50)
 * - unreadOnly: boolean (default: false)
 * - type: string (filter by notification type)
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

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || null;
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get notifications
    const result = await getUserNotifications(userId, {
      page,
      limit,
      unreadOnly,
      type
    });

    // Optionally include statistics
    let stats = null;
    if (includeStats) {
      stats = await getNotificationStats(userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
        ...(stats && { stats })
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications - Mark all notifications as read
 * 
 * @requires Authentication
 */
export async function PUT(request) {
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

    // Mark all as read
    const count = await markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      message: `${count} notification${count !== 1 ? 's' : ''} marked as read`,
      data: {
        markedAsRead: count
      }
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications - Delete all read notifications
 * 
 * @requires Authentication
 */
export async function DELETE(request) {
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

    // Delete all read notifications
    const count = await deleteReadNotifications(userId);

    return NextResponse.json({
      success: true,
      message: `${count} read notification${count !== 1 ? 's' : ''} deleted`,
      data: {
        deleted: count
      }
    });

  } catch (error) {
    console.error('Delete read notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
