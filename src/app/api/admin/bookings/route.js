/**
 * ADMIN BOOKING MANAGEMENT API
 * ============================
 * 
 * GET    /api/admin/bookings - List all bookings with filters
 * PUT    /api/admin/bookings/[id] - Modify booking status
 * DELETE /api/admin/bookings/[id] - Cancel booking with refund
 * 
 * Allows admins to:
 * - View all bookings across the platform
 * - Filter by status, venue, date range, user
 * - Modify booking status
 * - Cancel bookings and process refunds
 * 
 * @module api/admin/bookings
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const adminBookingQuerySchema = z.object({
  page: z.string().transform(v => Math.max(1, parseInt(v) || 1)),
  limit: z.string().transform(v => Math.min(100, Math.max(1, parseInt(v) || 20))),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  userId: z.string().optional(),
  venueId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'bookingDate', 'totalAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  adminNote: z.string().max(500).optional(),
  notifyUser: z.boolean().default(true)
});

// ==========================================
// GET /api/admin/bookings
// ==========================================

/**
 * List all bookings with advanced filtering and pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (max: 100, default: 20)
 * - status: Filter by booking status
 * - userId: Filter by specific user
 * - venueId: Filter by specific venue
 * - startDate: Filter bookings from date (YYYY-MM-DD)
 * - endDate: Filter bookings until date (YYYY-MM-DD)
 * - search: Search in user name, venue name, court name
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: asc or desc (default: desc)
 * 
 * @requires Admin Role
 * 
 * @example
 * GET /api/admin/bookings?status=CONFIRMED&page=1&limit=20
 * 
 * @returns {Object} Paginated bookings with user and venue details
 */
export async function GET(request) {
  try {
    // ==========================================
    // STEP 1: Verify Admin Access
    // ==========================================
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    // ==========================================
    // STEP 2: Parse and Validate Query Parameters
    // ==========================================
    const { searchParams } = new URL(request.url);
    
    const validationResult = adminBookingQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      userId: searchParams.get('userId'),
      venueId: searchParams.get('venueId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { 
      page, limit, status, userId, venueId, 
      startDate, endDate, search, sortBy, sortOrder 
    } = validationResult.data;

    const skip = (page - 1) * limit;

    // ==========================================
    // STEP 3: Build Query Conditions
    // ==========================================
    const where = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by user
    if (userId) {
      where.userId = userId;
    }

    // Filter by venue (through court relationship)
    if (venueId) {
      where.court = {
        facilityId: venueId
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) {
        where.bookingDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.bookingDate.lte = new Date(endDate);
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          court: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          court: {
            facility: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    // ==========================================
    // STEP 4: Fetch Bookings with Related Data
    // ==========================================
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          },
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
                  city: true,
                  state: true
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              method: true,
              status: true,
              razorpayPaymentId: true,
              totalAmount: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      
      prisma.booking.count({ where })
    ]);

    // ==========================================
    // STEP 5: Format Response Data
    // ==========================================
    const formattedBookings = bookings.map(booking => {
      const bookingDate = new Date(booking.bookingDate);
      const now = new Date();
      const isPast = bookingDate < now;
      const isUpcoming = bookingDate > now;

      return {
        id: booking.id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        confirmedAt: booking.confirmedAt,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        
        user: booking.user,
        
        court: {
          id: booking.court.id,
          name: booking.court.name,
          sportType: booking.court.sportType,
          pricePerHour: booking.court.pricePerHour
        },
        
        venue: {
          id: booking.court.facility.id,
          name: booking.court.facility.name,
          address: booking.court.facility.address,
          city: booking.court.facility.city,
          state: booking.court.facility.state
        },
        
        payment: booking.payment ? {
          id: booking.payment.id,
          method: booking.payment.method,
          status: booking.payment.status,
          gatewayId: booking.payment.razorpayPaymentId,
          amount: booking.payment.totalAmount
        } : null,
        
        // Booking state helpers
        isPast,
        isUpcoming,
        canCancel: booking.status === 'PENDING' || booking.status === 'CONFIRMED',
        canModify: !isPast && booking.status !== 'COMPLETED'
      };
    });

    // ==========================================
    // STEP 6: Calculate Summary Statistics
    // ==========================================
    const summaryStats = await prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
      _sum: { totalAmount: true }
    });

    const summary = {
      total: totalCount,
      byStatus: summaryStats.map(stat => ({
        status: stat.status,
        count: stat._count.status,
        revenue: stat._sum.totalAmount || 0
      }))
    };

    return NextResponse.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: {
        bookings: formattedBookings,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        summary,
        filters: {
          status,
          userId,
          venueId,
          startDate,
          endDate,
          search
        }
      }
    });

  } catch (error) {
    console.error('Admin get bookings error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve bookings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}