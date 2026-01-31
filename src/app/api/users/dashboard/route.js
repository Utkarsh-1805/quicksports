/**
 * USER DASHBOARD API
 * ==================
 * 
 * GET /api/users/dashboard - Get personalized dashboard data
 * 
 * Provides comprehensive dashboard including:
 * - Booking statistics (completed, cancelled, pending)
 * - Spending analysis
 * - Upcoming bookings
 * - Recent activity
 * - Favorite venues
 * - Personalized recommendations
 * 
 * @module api/users/dashboard
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyAuth } from "../../../../lib/auth";
import { 
  dashboardQuerySchema, 
  validateUserQuery 
} from "../../../../validations/user.validation";

// ==========================================
// GET /api/users/dashboard
// ==========================================

/**
 * Get personalized dashboard data
 * 
 * Query Parameters:
 * - period: 'week' | 'month' | 'quarter' | 'year' | 'all' (default: 'month')
 * - includeStats: Include booking statistics (default: true)
 * - includeUpcoming: Include upcoming bookings (default: true)
 * - includeRecent: Include recent activity (default: true)
 * 
 * @requires Authentication
 * 
 * @example
 * GET /api/users/dashboard?period=month&includeStats=true
 * 
 * @returns {Object} Dashboard data with stats, bookings, and recommendations
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
    const validation = validateUserQuery(searchParams, dashboardQuerySchema);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters', errors: validation.errors },
        { status: 400 }
      );
    }

    const { period, includeStats, includeUpcoming, includeRecent } = validation.data;

    // ==========================================
    // STEP 3: Calculate Date Range
    // ==========================================
    /**
     * LOGIC:
     * - Calculate start date based on period
     * - Used for filtering statistics
     */
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // 'all'
        startDate = new Date(0); // Beginning of time
    }

    // ==========================================
    // STEP 4: Fetch User Data
    // ==========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        preferences: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Initialize dashboard response
    const dashboard = {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        memberSince: user.createdAt
      },
      period: period
    };

    // ==========================================
    // STEP 5: Fetch Booking Statistics
    // ==========================================
    if (includeStats) {
      /**
       * LOGIC:
       * - Count bookings by status for the period
       * - Calculate total spending
       * - Find most booked sport
       * - Calculate average booking duration
       */
      const [
        totalBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings
      ] = await Promise.all([
        prisma.booking.count({
          where: { userId, createdAt: { gte: startDate } }
        }),
        prisma.booking.count({
          where: { userId, status: 'CONFIRMED', createdAt: { gte: startDate } }
        }),
        prisma.booking.count({
          where: { userId, status: 'COMPLETED', createdAt: { gte: startDate } }
        }),
        prisma.booking.count({
          where: { userId, status: 'CANCELLED', createdAt: { gte: startDate } }
        }),
        prisma.booking.count({
          where: { userId, status: 'PENDING', createdAt: { gte: startDate } }
        })
      ]);

      // Calculate total spending
      const spendingResult = await prisma.booking.aggregate({
        where: {
          userId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      });

      // Get most booked sport
      const sportStats = await prisma.booking.groupBy({
        by: ['courtId'],
        where: { userId, createdAt: { gte: startDate } },
        _count: { courtId: true },
        orderBy: { _count: { courtId: 'desc' } },
        take: 1
      });

      let favoriteSport = null;
      if (sportStats.length > 0) {
        const court = await prisma.court.findUnique({
          where: { id: sportStats[0].courtId },
          select: { sportType: true }
        });
        favoriteSport = court?.sportType;
      }

      // All-time stats for comparison
      const allTimeBookings = await prisma.booking.count({ where: { userId } });
      const allTimeSpending = await prisma.booking.aggregate({
        where: { userId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalAmount: true }
      });

      dashboard.stats = {
        period: {
          total: totalBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          pending: pendingBookings,
          totalSpent: spendingResult._sum.totalAmount || 0,
          favoriteSport
        },
        allTime: {
          totalBookings: allTimeBookings,
          totalSpent: allTimeSpending._sum.totalAmount || 0
        },
        rates: {
          completionRate: totalBookings > 0 
            ? Math.round((completedBookings / totalBookings) * 100) 
            : 0,
          cancellationRate: totalBookings > 0 
            ? Math.round((cancelledBookings / totalBookings) * 100) 
            : 0
        }
      };
    }

    // ==========================================
    // STEP 6: Fetch Upcoming Bookings
    // ==========================================
    if (includeUpcoming) {
      /**
       * LOGIC:
       * - Get next 5 confirmed bookings
       * - Include venue and court details
       * - Calculate days until booking
       */
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          userId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          bookingDate: { gte: today }
        },
        orderBy: [
          { bookingDate: 'asc' },
          { startTime: 'asc' }
        ],
        take: 5,
        include: {
          court: {
            select: {
              id: true,
              name: true,
              sportType: true,
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
        }
      });

      dashboard.upcomingBookings = upcomingBookings.map(booking => {
        const bookingDate = new Date(booking.bookingDate);
        const daysUntil = Math.ceil((bookingDate - now) / (1000 * 60 * 60 * 24));
        
        return {
          id: booking.id,
          date: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          amount: booking.totalAmount,
          daysUntil,
          court: {
            id: booking.court.id,
            name: booking.court.name,
            sportType: booking.court.sportType
          },
          venue: {
            id: booking.court.facility.id,
            name: booking.court.facility.name,
            address: booking.court.facility.address,
            city: booking.court.facility.city
          }
        };
      });
    }

    // ==========================================
    // STEP 7: Fetch Recent Activity
    // ==========================================
    if (includeRecent) {
      /**
       * LOGIC:
       * - Get last 10 bookings
       * - Get last 5 reviews
       * - Combine and sort by date
       */
      const recentBookings = await prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          court: {
            select: {
              name: true,
              sportType: true,
              facility: { select: { name: true } }
            }
          }
        }
      });

      const recentReviews = await prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          facility: { select: { id: true, name: true } }
        }
      });

      dashboard.recentActivity = {
        bookings: recentBookings.map(b => ({
          type: 'booking',
          id: b.id,
          description: `${b.status} booking at ${b.court.facility.name}`,
          sport: b.court.sportType,
          amount: b.totalAmount,
          status: b.status,
          date: b.createdAt
        })),
        reviews: recentReviews.map(r => ({
          type: 'review',
          id: r.id,
          description: `Reviewed ${r.facility.name}`,
          rating: r.rating,
          facilityId: r.facility.id,
          date: r.createdAt
        }))
      };
    }

    // ==========================================
    // STEP 8: Get Frequently Visited Venues
    // ==========================================
    const frequentVenues = await prisma.booking.groupBy({
      by: ['courtId'],
      where: { userId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _count: { courtId: true },
      orderBy: { _count: { courtId: 'desc' } },
      take: 5
    });

    if (frequentVenues.length > 0) {
      const courtIds = frequentVenues.map(v => v.courtId);
      const courts = await prisma.court.findMany({
        where: { id: { in: courtIds } },
        select: {
          id: true,
          name: true,
          sportType: true,
          facility: {
            select: {
              id: true,
              name: true,
              city: true
            }
          }
        }
      });

      dashboard.favoriteVenues = frequentVenues.map(fv => {
        const court = courts.find(c => c.id === fv.courtId);
        return {
          courtId: fv.courtId,
          courtName: court?.name,
          sportType: court?.sportType,
          venueId: court?.facility.id,
          venueName: court?.facility.name,
          city: court?.facility.city,
          bookingCount: fv._count.courtId
        };
      });
    } else {
      dashboard.favoriteVenues = [];
    }

    // ==========================================
    // STEP 9: Return Dashboard Response
    // ==========================================
    return NextResponse.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: { dashboard }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to load dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
