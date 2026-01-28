import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';
import { verifyAuthToken } from '../../../../../../../lib/auth';
import {
  validateTimeSlot,
  validateBulkTimeSlots 
} from '../../../../../../../validations/timeslot.validation';

// GET - List time slots for a specific court
export async function GET(request, { params }) {
  try {
    const { id: facilityId, courtId } = await params;
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Verify court exists and belongs to facility
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        facilityId: facilityId,
        isActive: true
      },
      include: {
        facility: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (!court) {
      return NextResponse.json({
        error: 'Court not found or not associated with this facility'
      }, { status: 404 });
    }

    // Build date filter
    let dateFilter = {};
    if (date) {
      dateFilter.date = new Date(date);
    } else if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Default to next 7 days
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      dateFilter.date = {
        gte: today,
        lte: nextWeek
      };
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: courtId,
        ...dateFilter
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      court: {
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        facility: court.facility.name
      },
      timeSlots: timeSlots.map(slot => ({
        id: slot.id,
        date: slot.date.toISOString().split('T')[0],
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBlocked: slot.isBlocked,
        blockReason: slot.blockReason,
        isBooked: !!slot.booking,
        booking: slot.booking ? {
          id: slot.booking.id,
          status: slot.booking.status,
          user: slot.booking.user.name
        } : null
      }))
    });

  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json({
      error: 'Failed to fetch time slots',
      details: error.message
    }, { status: 500 });
  }
}

// POST - Create time slot(s) for a court (venue owner only)
export async function POST(request, { params }) {
  try {
    const { id: facilityId, courtId } = await params;

    // Authenticate user
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify court exists and user owns the facility
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        facilityId: facilityId,
        isActive: true,
        facility: {
          ownerId: user.id
        }
      },
      include: {
        facility: {
          select: {
            name: true,
            status: true
          }
        }
      }
    });

    if (!court) {
      return NextResponse.json({
        error: 'Court not found or you do not have permission to manage this court'
      }, { status: 404 });
    }

    const body = await request.json();

    // Check if it's bulk creation or single slot
    if (body.dateRange && body.timeSlots) {
      // Bulk creation
      const validationResult = validateBulkTimeSlots(body);
      if (!validationResult.success) {
        return NextResponse.json({
          error: 'Validation failed',
          errors: validationResult.errors
        }, { status: 400 });
      }
      
      const validatedData = validationResult.data;
      const createdSlots = [];

      const startDate = new Date(validatedData.dateRange.startDate);
      const endDate = new Date(validatedData.dateRange.endDate);
      const excludeDates = new Set(validatedData.excludeDates || []);

      // Generate slots for each date in range
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip excluded dates
        if (excludeDates.has(dateStr)) continue;

        // Create each time slot for this date
        for (const timeSlot of validatedData.timeSlots) {
          try {
            const created = await prisma.timeSlot.create({
              data: {
                courtId: courtId,
                date: new Date(dateStr),
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                isBlocked: validatedData.isBlocked
              }
            });
            createdSlots.push({
              id: created.id,
              date: dateStr,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime
            });
          } catch (error) {
            // Skip if slot already exists
            if (!error.message.includes('Unique constraint')) {
              console.log(`Error creating slot for ${dateStr} ${timeSlot.startTime}: ${error.message}`);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdSlots.length} time slots`,
        timeSlots: createdSlots
      });

    } else {
      // Single slot creation
      const validationResult = validateTimeSlot(body);
      if (!validationResult.success) {
        return NextResponse.json({
          error: 'Validation failed',
          errors: validationResult.errors
        }, { status: 400 });
      }
      
      const validatedData = validationResult.data;

      const timeSlot = await prisma.timeSlot.create({
        data: {
          courtId: courtId,
          date: new Date(validatedData.date),
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          isBlocked: validatedData.isBlocked,
          blockReason: validatedData.blockReason
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Time slot created successfully',
        timeSlot: {
          id: timeSlot.id,
          date: timeSlot.date.toISOString().split('T')[0],
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          isBlocked: timeSlot.isBlocked,
          blockReason: timeSlot.blockReason
        }
      });
    }

  } catch (error) {
    console.error('Error creating time slots:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Time slot already exists for this court, date, and time'
      }, { status: 409 });
    }

    return NextResponse.json({
      error: 'Failed to create time slot',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete a specific time slot (venue owner only)
export async function DELETE(request, { params }) {
  try {
    const { id: facilityId, courtId } = await params;
    const url = new URL(request.url);
    const slotId = url.searchParams.get('slotId');

    if (!slotId) {
      return NextResponse.json({
        error: 'slotId parameter is required'
      }, { status: 400 });
    }

    // Authenticate user
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify time slot exists and user owns the facility
    const timeSlot = await prisma.timeSlot.findFirst({
      where: {
        id: slotId,
        courtId: courtId,
        court: {
          facilityId: facilityId,
          facility: {
            ownerId: user.id
          }
        }
      },
      include: {
        booking: true
      }
    });

    if (!timeSlot) {
      return NextResponse.json({
        error: 'Time slot not found or you do not have permission to delete it'
      }, { status: 404 });
    }

    // Check if slot has an active booking
    if (timeSlot.booking && timeSlot.booking.status !== 'CANCELLED') {
      return NextResponse.json({
        error: 'Cannot delete time slot with active booking. Cancel the booking first.'
      }, { status: 400 });
    }

    await prisma.timeSlot.delete({
      where: { id: slotId }
    });

    return NextResponse.json({
      success: true,
      message: 'Time slot deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json({
      error: 'Failed to delete time slot',
      details: error.message
    }, { status: 500 });
  }
}