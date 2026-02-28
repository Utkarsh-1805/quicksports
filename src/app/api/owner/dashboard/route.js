/**
 * CONSOLIDATED OWNER DASHBOARD API
 * ================================
 * 
 * GET /api/owner/dashboard - Get comprehensive dashboard data for facility owners
 * 
 * Provides a single endpoint with all key information:
 * - Business metrics (earnings, bookings, ratings)
 * - Recent activity and notifications
 * - Venue performance analytics
 * - Top performing courts
 * - Booking trends and insights
 * 
 * @module api/owner/dashboard
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

/**
 * GET /api/owner/dashboard
 * 
 * Get consolidated dashboard data for facility owner
 * 
 * Query Parameters:
 * - period: 'day' | 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 * - venueId: Filter data for specific venue (optional)
 * 
 * @requires Authentication
 * @requires Facility Owner Role
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

    const user = authResult.user;

    if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Facility owners only.' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 2: Parse Query Parameters
    // ==========================================
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const venueId = searchParams.get('venueId');

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
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
      default:
        startDate = new Date(0); // All time
    }

    // ==========================================
    // STEP 3: Get Owner's Facilities
    // ==========================================
    const facilitiesQuery = {
      ownerId: user.id,
      ...(venueId && { id: venueId })
    };

    const facilities = await prisma.facility.findMany({
      where: facilitiesQuery,
      select: {
        id: true,
        name: true,
        status: true,
        city: true,
        createdAt: true,
        _count: {
          select: {
            courts: { where: { isActive: true } },
            reviews: true
          }
        }
      }
    });

    if (facilities.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalEarnings: 0,
            totalBookings: 0,
            activeVenues: 0,
            averageRating: 0,
            totalCourts: 0
          },
          venues: [],
          recentActivity: [],
          topCourts: [],
          bookingTrends: []
        }
      });
    }

    const facilityIds = facilities.map(f => f.id);

    // ==========================================
    // STEP 4: Get Business Metrics
    // ==========================================
    const dateFilter = startDate ? { completedAt: { gte: startDate } } : {};

    const [
      payments,
      allBookings,
      recentBookings,
      courtStats,
      reviewStats
    ] = await Promise.all([
      // Earnings data
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          booking: {
            court: {
              facilityId: { in: facilityIds }
            }
          },
          ...dateFilter
        },
        include: {
          booking: {
            include: {
              court: {
                select: { name: true, facilityId: true }
              }
            }
          }
        }
      }),
      
      // All bookings for the period
      prisma.booking.findMany({
        where: {
          court: {
            facilityId: { in: facilityIds }
          },
          createdAt: startDate ? { gte: startDate } : undefined
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          bookingDate: true,
          courtId: true
        }
      }),

      // Recent activity (last 10 bookings)
      prisma.booking.findMany({
        where: {
          court: {
            facilityId: { in: facilityIds }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          court: {
            select: { name: true, sportType: true }
          }
        }
      }),

      // Court performance stats
      prisma.court.findMany({
        where: {
          facilityId: { in: facilityIds },
          isActive: true
        },
        include: {
          _count: {
            select: {
              bookings: {
                where: startDate ? { createdAt: { gte: startDate } } : undefined
              }
            }
          }
        }
      }),

      // Review statistics
      prisma.review.aggregate({
        where: {
          facilityId: { in: facilityIds }
        },
        _avg: { rating: true },
        _count: { rating: true }
      })
    ]);

    // ==========================================
    // STEP 5: Calculate Summary Metrics
    // ==========================================
    const totalEarnings = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalBookings = allBookings.length;
    const activeVenues = facilities.filter(f => f.status === 'APPROVED').length;
    const averageRating = reviewStats._avg.rating || 0;
    const totalCourts = facilities.reduce((sum, f) => sum + f._count.courts, 0);

    // Status breakdown
    const bookingsByStatus = allBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    // ==========================================
    // STEP 6: Top Performing Courts
    // ==========================================
    const topCourts = courtStats
      .map(court => ({
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        bookingCount: court._count.bookings,
        revenue: payments
          .filter(p => p.booking.courtId === court.id)
          .reduce((sum, p) => sum + p.totalAmount, 0)
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // ==========================================
    // STEP 7: Booking Trends (Last 30 days)
    // ==========================================
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const trendBookings = await prisma.booking.findMany({
      where: {
        court: {
          facilityId: { in: facilityIds }
        },
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    // Group by day
    const bookingTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = trendBookings.filter(b => 
        b.createdAt.toISOString().split('T')[0] === dateStr
      );
      
      bookingTrends.push({
        date: dateStr,
        bookings: dayBookings.length,
        revenue: dayBookings.reduce((sum, b) => sum + b.totalAmount, 0)
      });
    }

    // ==========================================
    // STEP 8: Venue Performance
    // ==========================================
    const venuePerformance = facilities.map(facility => {
      const facilityPayments = payments.filter(p => 
        p.booking.court.facilityId === facility.id
      );
      const facilityBookings = allBookings.filter(b => 
        courtStats.some(c => c.facilityId === facility.id && c.id === b.courtId)
      );
      
      return {
        id: facility.id,
        name: facility.name,
        status: facility.status,
        city: facility.city,
        totalCourts: facility._count.courts,
        totalBookings: facilityBookings.length,
        totalEarnings: facilityPayments.reduce((sum, p) => sum + p.totalAmount, 0),
        reviewCount: facility._count.reviews
      };
    });

    // ==========================================
    // STEP 9: Recent Activity Summary
    // ==========================================
    const recentActivity = recentBookings.map(booking => ({
      id: booking.id,
      type: 'booking',
      userName: booking.user.name,
      courtName: booking.court.name,
      sportType: booking.court.sportType,
      status: booking.status,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      amount: booking.totalAmount,
      createdAt: booking.createdAt,
      message: `${booking.user.name} booked ${booking.court.name} for ${booking.court.sportType}`
    }));

    // ==========================================
    // STEP 10: Return Dashboard Data
    // ==========================================
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalBookings,
          activeVenues,
          averageRating: Math.round(averageRating * 10) / 10,
          totalCourts,
          bookingsByStatus
        },
        venues: venuePerformance,
        topCourts,
        bookingTrends,
        recentActivity,
        period: period,
        dateRange: {
          start: startDate?.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Owner dashboard error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}