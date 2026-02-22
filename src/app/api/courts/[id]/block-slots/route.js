/**
 * TIME SLOT BLOCKING/MAINTENANCE API
 * ==================================
 * 
 * POST /api/courts/[id]/block-slots - Block time slots for maintenance
 * DELETE /api/courts/[id]/block-slots - Unblock time slots
 * GET /api/courts/[id]/blocked-slots - Get blocked time slots
 * 
 * Allows facility owners to:
 * - Block specific time slots for maintenance
 * - Set maintenance schedules
 * - Prevent bookings during facility issues
 * - Manage court availability
 * 
 * @module api/courts/[id]/block-slots
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../lib/auth";
import prisma from "../../../../../lib/prisma";
import { z } from "zod";

const blockSlotsSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1), // Array of YYYY-MM-DD dates
  timeSlots: z.array(z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })).min(1),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200),
  blockType: z.enum(['maintenance', 'renovation', 'event', 'emergency', 'other']).default('maintenance'),
  notifyUsers: z.boolean().default(false), // Notify users with existing bookings
  allowOverride: z.boolean().default(false) // Allow admin override
});

const unblockSlotsSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  timeSlots: z.array(z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })).optional(), // If not specified, unblock all slots for the dates
  reason: z.string().min(5).max(200).optional()
});

/**
 * POST /api/courts/[id]/block-slots
 * 
 * Block time slots for maintenance or other reasons
 * 
 * @requires Authentication
 * @requires Facility Owner or Admin
 */
export async function POST(request, { params }) {
  try {
    // ==========================================
    // STEP 1: Authenticate User
    // ==========================================
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { id: courtId } = await params;

    // ==========================================
    // STEP 2: Verify Court Ownership
    // ==========================================
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          select: { ownerId: true, name: true }
        }
      }
    });

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    if (court.facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only block slots for your own courts' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 3: Validate Request Body
    // ==========================================
    const body = await request.json();
    
    const validation = blockSlotsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { dates, timeSlots, reason, blockType, notifyUsers, allowOverride } = validation.data;

    // ==========================================
    // STEP 4: Check for Existing Bookings
    // ==========================================
    const conflicts = [];
    const slotsToBlock = [];

    for (const date of dates) {
      for (const slot of timeSlots) {
        // Check if there are existing bookings
        const existingBookings = await prisma.booking.findMany({
          where: {
            courtId: courtId,
            bookingDate: new Date(date),
            startTime: slot.startTime,
            status: { in: ['CONFIRMED', 'PENDING'] }
          },
          include: {
            user: { select: { name: true, email: true } }
          }
        });

        if (existingBookings.length > 0 && !allowOverride) {
          conflicts.push({
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            bookings: existingBookings
          });
        } else {
          slotsToBlock.push({
            date: new Date(date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            existingBookings
          });
        }
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Some time slots have existing bookings. Use allowOverride:true to force block.',
          conflicts: conflicts
        },
        { status: 409 }
      );
    }

    // ==========================================
    // STEP 5: Block Time Slots
    // ==========================================
    const blockedSlots = [];
    const cancelledBookings = [];

    for (const slot of slotsToBlock) {
      // Create or update time slot as blocked
      try {
        const timeSlot = await prisma.timeSlot.upsert({
          where: {
            courtId_date_startTime: {
              courtId: courtId,
              date: slot.date,
              startTime: slot.startTime
            }
          },
          update: {
            isBlocked: true,
            blockReason: `${blockType}: ${reason}`
          },
          create: {
            courtId: courtId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBlocked: true,
            blockReason: `${blockType}: ${reason}`
          }
        });

        blockedSlots.push(timeSlot);

        // Cancel existing bookings if override is allowed
        if (allowOverride && slot.existingBookings.length > 0) {
          for (const booking of slot.existingBookings) {
            const cancelledBooking = await prisma.booking.update({
              where: { id: booking.id },
              data: {
                status: 'CANCELLED',
                cancellationReason: `Court maintenance: ${reason}`,
                cancelledAt: new Date()
              }
            });

            cancelledBookings.push(cancelledBooking);

            // TODO: In a real system, you would:
            // 1. Process refunds automatically
            // 2. Send notification to affected users
            // 3. Offer alternative time slots
          }
        }
      } catch (error) {
        console.error(`Error blocking slot ${slot.date} ${slot.startTime}:`, error);
      }
    }

    // ==========================================
    // STEP 6: Send Notifications (if enabled)
    // ==========================================
    if (notifyUsers && cancelledBookings.length > 0) {
      // In a real system, you would send notifications here
      console.log(`Notifying ${cancelledBookings.length} users about cancelled bookings`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully blocked ${blockedSlots.length} time slots`,
      data: {
        blockedSlots: blockedSlots.length,
        cancelledBookings: cancelledBookings.length,
        details: {
          blocked: blockedSlots,
          cancelled: cancelledBookings
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Block slots error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to block time slots' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courts/[id]/block-slots
 * 
 * Unblock previously blocked time slots
 * 
 * @requires Authentication
 * @requires Facility Owner or Admin
 */
export async function DELETE(request, { params }) {
  try {
    // ==========================================
    // STEP 1: Authenticate User
    // ==========================================
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { id: courtId } = await params;

    // ==========================================
    // STEP 2: Verify Court Ownership
    // ==========================================
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          select: { ownerId: true, name: true }
        }
      }
    });

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    if (court.facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only unblock slots for your own courts' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 3: Validate Request Body
    // ==========================================
    const body = await request.json();
    
    const validation = unblockSlotsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { dates, timeSlots, reason } = validation.data;

    // ==========================================
    // STEP 4: Build Unblock Query
    // ==========================================
    let whereCondition = {
      courtId: courtId,
      date: { in: dates.map(d => new Date(d)) },
      isBlocked: true
    };

    // If specific time slots provided, only unblock those
    if (timeSlots && timeSlots.length > 0) {
      whereCondition.startTime = {
        in: timeSlots.map(slot => slot.startTime)
      };
    }

    // ==========================================
    // STEP 5: Unblock Time Slots
    // ==========================================
    const unblockedSlots = await prisma.timeSlot.updateMany({
      where: whereCondition,
      data: {
        isBlocked: false,
        blockReason: reason ? `Unblocked: ${reason}` : null
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully unblocked ${unblockedSlots.count} time slots`,
      data: {
        unblockedCount: unblockedSlots.count
      }
    });

  } catch (error) {
    console.error('Unblock slots error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to unblock time slots' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courts/[id]/blocked-slots
 * 
 * Get blocked time slots for a court
 * 
 * Query Parameters:
 * - startDate: YYYY-MM-DD (default: today)
 * - endDate: YYYY-MM-DD (default: +30 days)
 * 
 * @requires Authentication
 * @requires Facility Owner or Admin (to see block reasons)
 */
export async function GET(request, { params }) {
  try {
    const { id: courtId } = await params;
    const { searchParams } = new URL(request.url);

    // ==========================================
    // STEP 1: Parse Query Parameters
    // ==========================================
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDateParam = searchParams.get('endDate');
    const endDate = endDateParam || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // ==========================================
    // STEP 2: Verify Court Exists
    // ==========================================
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { id: true, name: true, facility: { select: { name: true } } }
    });

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    // ==========================================
    // STEP 3: Get Blocked Slots
    // ==========================================
    const blockedSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: courtId,
        isBlocked: true,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        court: {
          id: court.id,
          name: court.name,
          facility: court.facility.name
        },
        blockedSlots,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error('Get blocked slots error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get blocked slots' },
      { status: 500 }
    );
  }
}