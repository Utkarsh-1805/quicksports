import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/auth";

// GET /api/bookings - Get user's bookings
export async function GET(request) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const skip = (page - 1) * limit;
    
    const where = {
      userId: user.id,
      ...(status && { status })
    };
    
    const bookings = await prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: {
        court: {
          include: {
            facility: {
              select: {
                name: true,
                address: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const totalCount = await prisma.booking.count({ where });
    
    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { courtId, bookingDate, startTime, endTime, totalAmount } = body;
    
    // Validate required fields
    if (!courtId || !bookingDate || !startTime || !endTime || !totalAmount) {
      return NextResponse.json(
        { success: false, message: 'All booking details are required' },
        { status: 400 }
      );
    }
    
    // Check if court exists and is active
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        isActive: true
      },
      include: {
        facility: {
          select: {
            status: true
          }
        }
      }
    });
    
    if (!court || court.facility.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, message: 'Court not available for booking' },
        { status: 400 }
      );
    }
    
    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: new Date(bookingDate),
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });
    
    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, message: 'Time slot is already booked' },
        { status: 400 }
      );
    }
    
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        courtId,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        totalAmount: parseFloat(totalAmount),
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentId: `PAY_${Date.now()}`
      },
      include: {
        court: {
          include: {
            facility: {
              select: {
                name: true,
                address: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
    
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}