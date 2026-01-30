/**
 * COURT AVAILABILITY API
 * ======================
 * 
 * GET /api/courts/{id}/availability?date=YYYY-MM-DD
 * 
 * Returns available time slots for a court on a specific date.
 * 
 * LOGIC:
 * 1. Validate court exists and is active
 * 2. Generate all possible slots based on court's operating hours
 * 3. Mark slots that are already booked
 * 4. Filter out past slots if date is today
 * 5. Return availability map
 * 
 * RESPONSE:
 * {
 *   court: { id, name, sportType, pricePerHour, facility },
 *   date: "2025-01-27",
 *   operatingHours: { opening: "06:00", closing: "22:00" },
 *   slots: [
 *     { startTime: "06:00", endTime: "07:00", status: "available" },
 *     { startTime: "07:00", endTime: "08:00", status: "booked" },
 *     ...
 *   ],
 *   summary: { total: 16, available: 14, booked: 2 }
 * }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  availabilitySchema, 
  generateTimeSlots 
} from '@/validations/booking.validation';

export async function GET(request, { params }) {
  try {
    const { id: courtId } = await params;
    const { searchParams } = new URL(request.url);
    
    // ==========================================
    // STEP 1: Validate Query Parameters
    // ==========================================
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Date is required',
          hint: 'Add ?date=YYYY-MM-DD to your request'
        },
        { status: 400 }
      );
    }

    const validation = availabilitySchema.safeParse({ date: dateParam });
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validation.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { date } = validation.data;

    // ==========================================
    // STEP 2: Fetch Court with Facility Details
    // ==========================================
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true
          }
        }
      }
    });

    if (!court) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Court not found',
          courtId 
        },
        { status: 404 }
      );
    }

    if (!court.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Court is not available for booking',
          reason: 'This court has been marked as inactive'
        },
        { status: 400 }
      );
    }

    // ==========================================
    // STEP 3: Generate All Possible Time Slots
    // ==========================================
    // Based on court's operating hours
    const openingTime = court.openingTime || '06:00';
    const closingTime = court.closingTime || '22:00';
    
    const allSlots = generateTimeSlots(openingTime, closingTime);

    // ==========================================
    // STEP 4: Get Existing Bookings for This Date
    // ==========================================
    // We only care about bookings that are PENDING or CONFIRMED
    // CANCELLED bookings should not block slots
    const requestedDate = new Date(date);
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: courtId,
        bookingDate: requestedDate,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true
      }
    });

    // ==========================================
    // STEP 5: Also Check for Blocked Time Slots
    // ==========================================
    // TimeSlots can be blocked for maintenance, etc.
    const blockedSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: courtId,
        date: requestedDate,
        isBlocked: true
      },
      select: {
        startTime: true,
        endTime: true,
        blockReason: true
      }
    });

    // ==========================================
    // STEP 6: Mark Each Slot's Availability
    // ==========================================
    const now = new Date();
    const isToday = requestedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const slotsWithAvailability = allSlots.map(slot => {
      // Check if slot is booked
      const booking = existingBookings.find(b => 
        b.startTime === slot.startTime && b.endTime === slot.endTime
      );

      // Check if slot overlaps with any booking
      const hasOverlap = existingBookings.some(b => {
        const toMinutes = (time) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };
        const slotStart = toMinutes(slot.startTime);
        const slotEnd = toMinutes(slot.endTime);
        const bookStart = toMinutes(b.startTime);
        const bookEnd = toMinutes(b.endTime);
        
        // Check overlap: Start1 < End2 AND Start2 < End1
        return slotStart < bookEnd && bookStart < slotEnd;
      });

      // Check if slot is blocked
      const blocked = blockedSlots.find(b => 
        b.startTime === slot.startTime
      );

      // Check if slot is in the past (for today)
      let isPast = false;
      if (isToday) {
        const [slotHour, slotMin] = slot.startTime.split(':').map(Number);
        const slotMinutes = slotHour * 60 + slotMin;
        const nowMinutes = currentHour * 60 + currentMinute;
        isPast = slotMinutes <= nowMinutes;
      }

      // Determine status
      let status = 'available';
      let reason = null;

      if (isPast) {
        status = 'past';
        reason = 'This time slot has already passed';
      } else if (hasOverlap || booking) {
        status = 'booked';
        reason = 'Already booked';
      } else if (blocked) {
        status = 'blocked';
        reason = blocked.blockReason || 'Not available';
      }

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        status,
        ...(reason && { reason })
      };
    });

    // ==========================================
    // STEP 7: Calculate Summary
    // ==========================================
    const summary = {
      total: slotsWithAvailability.length,
      available: slotsWithAvailability.filter(s => s.status === 'available').length,
      booked: slotsWithAvailability.filter(s => s.status === 'booked').length,
      blocked: slotsWithAvailability.filter(s => s.status === 'blocked').length,
      past: slotsWithAvailability.filter(s => s.status === 'past').length
    };

    // ==========================================
    // STEP 8: Return Response
    // ==========================================
    return NextResponse.json({
      success: true,
      court: {
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        pricePerHour: court.pricePerHour,
        facility: court.facility
      },
      date: date,
      operatingHours: {
        opening: openingTime,
        closing: closingTime
      },
      slots: slotsWithAvailability,
      summary
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to check availability',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
