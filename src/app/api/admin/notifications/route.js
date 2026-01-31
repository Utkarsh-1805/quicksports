/**
 * ADMIN NOTIFICATIONS API
 * ========================
 * 
 * POST /api/admin/notifications - Send notification to user(s)
 * GET  /api/admin/notifications - View all notifications (admin overview)
 * 
 * Allows admin to send notifications to users for testing or announcements.
 * 
 * @module api/admin/notifications
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";
import { createNotification, createBulkNotifications } from "../../../../services/notification.service";
import { z } from "zod";

// Validation schema for sending notifications
const sendNotificationSchema = z.object({
  userId: z.string().optional(), // Single user
  userIds: z.array(z.string()).optional(), // Multiple users
  type: z.enum([
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'BOOKING_REMINDER',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'REFUND_PROCESSED',
    'REVIEW_RESPONSE',
    'VENUE_APPROVED',
    'VENUE_REJECTED',
    'SYSTEM_ALERT',
    'PROMOTIONAL'
  ]),
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(1000).optional(),
  data: z.object({}).passthrough().optional()
});

/**
 * POST /api/admin/notifications - Send notification to user(s)
 * 
 * Body:
 * - userId: string (send to single user)
 * - userIds: string[] (send to multiple users)
 * - type: NotificationType (required)
 * - title: string (optional - uses template if not provided)
 * - message: string (optional - uses template if not provided)
 * - data: object (optional - additional data)
 * 
 * @requires Admin Authentication
 */
export async function POST(request) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const body = await request.json();

    // Validate request
    const validation = sendNotificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        },
        { status: 400 }
      );
    }

    const { userId, userIds, type, title, message, data } = validation.data;

    // Check that either userId or userIds is provided
    if (!userId && (!userIds || userIds.length === 0)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Either userId or userIds is required'
        },
        { status: 400 }
      );
    }

    let result;

    if (userId) {
      // Send to single user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const notification = await createNotification({
        userId,
        type,
        data: data || {},
        customTitle: title,
        customMessage: message
      });

      result = {
        sent: 1,
        notification
      };

    } else if (userIds && userIds.length > 0) {
      // Send to multiple users
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true }
      });

      const validUserIds = users.map(u => u.id);
      
      if (validUserIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid users found' },
          { status: 404 }
        );
      }

      const count = await createBulkNotifications(validUserIds, type, {
        ...data,
        customTitle: title,
        customMessage: message
      });

      result = {
        sent: count,
        targetedUsers: userIds.length,
        validUsers: validUserIds.length
      };
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully`,
      data: result
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/notifications - Get notifications overview
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50)
 * - type: NotificationType filter
 * - userId: filter by user
 * 
 * @requires Admin Authentication
 */
export async function GET(request) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 50));
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    const where = {
      ...(type && { type }),
      ...(userId && { userId })
    };

    const [notifications, total, stats] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          total,
          byType: stats.reduce((acc, s) => {
            acc[s.type] = s._count.type;
            return acc;
          }, {})
        }
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
