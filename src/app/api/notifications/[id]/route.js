/**
 * INDIVIDUAL NOTIFICATION API
 * ============================
 * 
 * GET    /api/notifications/[id] - Get notification details
 * PUT    /api/notifications/[id] - Mark notification as read
 * DELETE /api/notifications/[id] - Delete notification
 * 
 * @module api/notifications/[id]
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { markAsRead, deleteNotification } from "../../../../services/notification.service";

/**
 * GET /api/notifications/[id] - Get notification details
 * 
 * @requires Authentication
 */
export async function GET(request, { params }) {
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
    const { id } = await params;

    // Get notification
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId // Ensure user owns this notification
      }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification retrieved successfully',
      data: { notification }
    });

  } catch (error) {
    console.error('Get notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notification' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/[id] - Mark notification as read
 * 
 * @requires Authentication
 */
export async function PUT(request, { params }) {
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
    const { id } = await params;

    // Mark as read
    const notification = await markAsRead(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });

  } catch (error) {
    // Check if notification not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    console.error('Mark as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id] - Delete notification
 * 
 * @requires Authentication
 */
export async function DELETE(request, { params }) {
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
    const { id } = await params;

    // Delete notification
    await deleteNotification(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    // Check if notification not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
