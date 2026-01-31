/**
 * NOTIFICATION PREFERENCES API
 * =============================
 * 
 * GET /api/notifications/preferences - Get notification preferences
 * PUT /api/notifications/preferences - Update notification preferences
 * 
 * Manages user preferences for different notification types and channels.
 * 
 * @module api/notifications/preferences
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { z } from "zod";

// Default notification preferences
const DEFAULT_PREFERENCES = {
  email: {
    bookingConfirmed: true,
    bookingCancelled: true,
    bookingReminder: true,
    paymentSuccess: true,
    paymentFailed: true,
    refundProcessed: true,
    reviewResponse: true,
    venueUpdates: true,
    promotional: false,
    systemAlerts: true
  },
  push: {
    bookingConfirmed: true,
    bookingCancelled: true,
    bookingReminder: true,
    paymentSuccess: true,
    paymentFailed: true,
    refundProcessed: true,
    reviewResponse: true,
    venueUpdates: true,
    promotional: false,
    systemAlerts: true
  },
  sms: {
    bookingConfirmed: false,
    bookingCancelled: true,
    bookingReminder: true,
    paymentSuccess: false,
    paymentFailed: true,
    refundProcessed: false,
    reviewResponse: false,
    venueUpdates: false,
    promotional: false,
    systemAlerts: false
  },
  reminder: {
    enabled: true,
    hoursBeforeBooking: 24, // Send reminder 24 hours before
    dayOfBookingReminder: true // Send reminder on the day of booking
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  }
};

// Validation schema for preferences update
const preferencesSchema = z.object({
  email: z.object({
    bookingConfirmed: z.boolean().optional(),
    bookingCancelled: z.boolean().optional(),
    bookingReminder: z.boolean().optional(),
    paymentSuccess: z.boolean().optional(),
    paymentFailed: z.boolean().optional(),
    refundProcessed: z.boolean().optional(),
    reviewResponse: z.boolean().optional(),
    venueUpdates: z.boolean().optional(),
    promotional: z.boolean().optional(),
    systemAlerts: z.boolean().optional()
  }).optional(),
  push: z.object({
    bookingConfirmed: z.boolean().optional(),
    bookingCancelled: z.boolean().optional(),
    bookingReminder: z.boolean().optional(),
    paymentSuccess: z.boolean().optional(),
    paymentFailed: z.boolean().optional(),
    refundProcessed: z.boolean().optional(),
    reviewResponse: z.boolean().optional(),
    venueUpdates: z.boolean().optional(),
    promotional: z.boolean().optional(),
    systemAlerts: z.boolean().optional()
  }).optional(),
  sms: z.object({
    bookingConfirmed: z.boolean().optional(),
    bookingCancelled: z.boolean().optional(),
    bookingReminder: z.boolean().optional(),
    paymentSuccess: z.boolean().optional(),
    paymentFailed: z.boolean().optional(),
    refundProcessed: z.boolean().optional(),
    reviewResponse: z.boolean().optional(),
    venueUpdates: z.boolean().optional(),
    promotional: z.boolean().optional(),
    systemAlerts: z.boolean().optional()
  }).optional(),
  reminder: z.object({
    enabled: z.boolean().optional(),
    hoursBeforeBooking: z.number().min(1).max(72).optional(),
    dayOfBookingReminder: z.boolean().optional()
  }).optional(),
  quietHours: z.object({
    enabled: z.boolean().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional()
  }).optional()
}).strict();

/**
 * GET /api/notifications/preferences - Get notification preferences
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

    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        preferences: true
      }
    });

    // Extract notification preferences or use defaults
    const userPrefs = user?.preferences || {};
    const notificationPrefs = userPrefs.notifications || DEFAULT_PREFERENCES;

    return NextResponse.json({
      success: true,
      message: 'Notification preferences retrieved successfully',
      data: {
        preferences: notificationPrefs,
        defaults: DEFAULT_PREFERENCES
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences - Update notification preferences
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
    const body = await request.json();

    // Validate request body
    const validation = preferencesSchema.safeParse(body);
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

    // Get current user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    const currentPrefs = user?.preferences || {};
    const currentNotificationPrefs = currentPrefs.notifications || DEFAULT_PREFERENCES;

    // Deep merge the new preferences with existing ones
    const updatedNotificationPrefs = deepMerge(currentNotificationPrefs, validation.data);

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPrefs,
          notifications: updatedNotificationPrefs
        }
      },
      select: {
        id: true,
        preferences: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: updatedUser.preferences?.notifications || updatedNotificationPrefs
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * Deep merge utility function
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  
  return result;
}
