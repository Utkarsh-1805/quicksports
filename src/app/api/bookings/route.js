/**
 * BOOKINGS API
 * ============
 * 
 * POST /api/bookings - Create a new booking
 * GET /api/bookings - List user's bookings
 * 
 * All endpoints require authentication.
 * 
 * BOOKING FLOW:
 * 1. User checks court availability
 * 2. User creates booking (PENDING status)
 * 3. User pays → status becomes CONFIRMED
 * 4. Booking completes → status becomes COMPLETED
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { 
  createBookingSchema,
  bookingValidation,
  validateQueryParams,
  isWithinOperatingHours,
  hasTimeConflict,
  calculateBookingAmount 
} from "@/validations/booking.validation";

/**
 * GET /api/bookings - List user's bookings
 * 
 * QUERY PARAMS:
 * - status: Filter by PENDING, CONFIRMED, CANCELLED, COMPLETED
 * - upcoming: "true" for future bookings, "false" for past
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 50)
 * 
 * EXAMPLE:
 * GET /api/bookings?status=CONFIRMED&upcoming=true&page=1&limit=10
 */
export async function GET(request) {
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
    
    const userId = authResult.user.id;
    
    // ==========================================
    // STEP 2: Parse Query Parameters
    // ==========================================
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 10));
    
    const skip = (page - 1) * limit;
    
    // ==========================================
    // STEP 3: Build Query Filters
    // ==========================================
    const where = {
      userId: userId
    };
    
    // Filter by status
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      where.status = status;
    }
    
    // Filter upcoming/past bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (upcoming === 'true') {
      where.bookingDate = { gte: today };
    } else if (upcoming === 'false') {
      where.bookingDate = { lt: today };
    }
    
    // ==========================================
    // STEP 4: Get Bookings with Pagination
    // ==========================================
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          court: {
            select: {
              id: true,
              name: true,
              sportType: true,
              pricePerHour: true,
              facility: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true
                }
              }
            }
          }
        },
        orderBy: [
          { bookingDate: 'desc' },
          { startTime: 'desc' }
        ]
      }),
      prisma.booking.count({ where })
    ]);
    
    // ==========================================
    // STEP 5: Format and Return Response
    // ==========================================
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      bookings: bookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        date: booking.bookingDate.toISOString().split('T')[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        court: booking.court,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    });
    
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch bookings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings - Create new booking
 * 
 * REQUEST BODY:
 * {
 *   "courtId": "court-021",
 *   "date": "2025-01-28",
 *   "startTime": "10:00",
 *   "endTime": "12:00"
 * }
 * 
 * FLOW:
 * 1. Authenticate user
 * 2. Validate request body
 * 3. Verify court exists and is active
 * 4. Check if time is within operating hours
 * 5. Check for booking conflicts
 * 6. Calculate total amount
 * 7. Create booking (PENDING status)
 * 8. Return booking details
 */
export async function POST(request) {
  try {
    // ==========================================
    // STEP 1: Authenticate User
    // ==========================================
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          hint: 'Please login and include the Authorization header'
        },
        { status: 401 }
      );
    }
    
    const userId = authResult.user.id;
    
    // ==========================================
    // STEP 2: Parse and Validate Request Body
    // ==========================================
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const validation = createBookingSchema.safeParse(body);
    
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

    const { courtId, date, startTime, endTime } = validation.data;
    
    // ==========================================
    // STEP 3: Verify Court Exists and Is Active
    // ==========================================
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            city: true,
            status: true
          }
        }
      }
    });
    
    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found', courtId },
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
    
    if (court.facility.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Facility is not approved for bookings',
          facilityStatus: court.facility.status
        },
        { status: 400 }
      );
    }
    
    // ==========================================
    // STEP 4: Check Operating Hours
    // ==========================================
    const openingTime = court.openingTime || '06:00';
    const closingTime = court.closingTime || '22:00';

    if (!isWithinOperatingHours(startTime, endTime, openingTime, closingTime)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking time is outside operating hours',
          operatingHours: { opening: openingTime, closing: closingTime },
          requested: { startTime, endTime }
        },
        { status: 400 }
      );
    }
    
    // ==========================================
    // STEP 5: Check for Booking Conflicts
    // ==========================================
    // Create date without timezone issues by using the date string directly
    // The date validation ensures it's in YYYY-MM-DD format
    const bookingDate = new Date(`${date}T00:00:00.000Z`); // Force UTC midnight
    
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: bookingDate,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true
      }
    });
    
    if (hasTimeConflict(startTime, endTime, existingBookings)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Time slot is not available',
          reason: 'This time slot overlaps with an existing booking',
          hint: 'Please check availability and choose a different time'
        },
        { status: 409 }
      );
    }
    
    // ==========================================
    // STEP 6: Calculate Total Amount
    // ==========================================
    const totalAmount = calculateBookingAmount(startTime, endTime, court.pricePerHour);
    
    // ==========================================
    // STEP 7: Create Booking
    // ==========================================
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        courtId,
        bookingDate: bookingDate,
        startTime,
        endTime,
        totalAmount,
        status: 'PENDING'
      },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true,
            facility: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // ==========================================
    // STEP 8: Return Success Response
    // ==========================================
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        date: date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        court: booking.court,
        user: {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email
        },
        createdAt: booking.createdAt
      },
      nextSteps: {
        message: 'Complete payment to confirm your booking',
        paymentUrl: `/api/bookings/${booking.id}/pay`,
        viewUrl: `/api/bookings/${booking.id}`,
        cancelUrl: `/api/bookings/${booking.id}/cancel`
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create booking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}