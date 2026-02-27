/**
 * ADMIN ANALYTICS DASHBOARD API
 * =============================
 * 
 * GET /api/admin/analytics - Comprehensive admin analytics
 * 
 * Provides complete business intelligence including:
 * - Revenue analytics and trends
 * - User growth and engagement metrics
 * - Booking statistics and patterns
 * - Venue performance analytics
 * - Court utilization rates
 * - Popular sports and time slots
 * 
 * @module api/admin/analytics
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";

// ==========================================
// GET /api/admin/analytics
// ==========================================

/**
 * Get comprehensive admin dashboard analytics
 * 
 * Query Parameters:
 * - period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all' (default: 'month')
 * - timezone: Timezone for date calculations (default: 'UTC')
 * 
 * @requires Admin Role
 * 
 * @example
 * GET /api/admin/analytics?period=month
 * 
 * @returns {Object} Complete analytics dashboard data
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

    const admin = adminAuth.user;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // ==========================================
    // STEP 2: Calculate Date Range
    // ==========================================
    const now = new Date();
    let startDate, previousStartDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        const weekStart = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        previousStartDate = new Date(now.getFullYear(), quarterMonth - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default: // 'all'
        startDate = new Date(0);
        previousStartDate = new Date(0);
    }

    // ==========================================
    // STEP 3: Get High-Level Metrics
    // ==========================================
    /**
     * OVERVIEW METRICS:
     * - Total users, venues, bookings
     * - Growth rates compared to previous period
     * - Revenue totals and trends
     */
    const [
      // All-time totals
      allTimeUsers,
      allTimeVenues,
      allTimeBookings,
      allTimeRevenue,
      // Current period counts (for growth)
      periodUsers,
      periodVenues,
      periodBookings,
      periodRevenue,
      // Previous period (for growth comparison)
      previousUsers,
      previousVenues,
      previousBookings,
      previousRevenue,
      // Pending approvals count
      pendingApprovals,
      // Open reports count  
      pendingReports
    ] = await Promise.all([
      // All-time totals
      prisma.user.count(),
      prisma.facility.count({ where: { status: 'APPROVED' } }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalAmount: true }
      }),
      // Current period
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.facility.count({ where: { createdAt: { gte: startDate }, status: 'APPROVED' } }),
      prisma.booking.count({ where: { createdAt: { gte: startDate } } }),
      prisma.booking.aggregate({
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      }),
      
      // Previous period for comparison
      prisma.user.count({ 
        where: { 
          createdAt: { gte: previousStartDate, lt: startDate } 
        } 
      }),
      prisma.facility.count({ 
        where: { 
          createdAt: { gte: previousStartDate, lt: startDate },
          status: 'APPROVED'
        } 
      }),
      prisma.booking.count({ 
        where: { 
          createdAt: { gte: previousStartDate, lt: startDate } 
        } 
      }),
      prisma.booking.aggregate({
        where: { 
          createdAt: { gte: previousStartDate, lt: startDate },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      }),
      // Pending approvals
      prisma.facility.count({ where: { status: 'PENDING' } }),
      // Pending reports (if Report model exists, otherwise 0)
      prisma.report?.count({ where: { status: 'PENDING' } }).catch(() => 0) || Promise.resolve(0)
    ]);

    // Use all-time totals for display
    const totalUsers = allTimeUsers;
    const totalVenues = allTimeVenues;
    const totalBookings = allTimeBookings;
    const totalRevenue = allTimeRevenue;

    // Calculate growth rates using period-specific counts
    const userGrowth = previousUsers > 0 ? ((periodUsers - previousUsers) / previousUsers * 100) : (periodUsers > 0 ? 100 : 0);
    const venueGrowth = previousVenues > 0 ? ((periodVenues - previousVenues) / previousVenues * 100) : (periodVenues > 0 ? 100 : 0);
    const bookingGrowth = previousBookings > 0 ? ((periodBookings - previousBookings) / previousBookings * 100) : (periodBookings > 0 ? 100 : 0);
    const revenueGrowth = previousRevenue._sum.totalAmount > 0 
      ? (((periodRevenue._sum.totalAmount || 0) - previousRevenue._sum.totalAmount) / previousRevenue._sum.totalAmount * 100) 
      : (periodRevenue._sum.totalAmount > 0 ? 100 : 0);

    // ==========================================
    // STEP 4: Revenue Analytics
    // ==========================================
    /**
     * REVENUE BREAKDOWN:
     * - Total revenue by status
     * - Revenue by sport type
     * - Revenue by venue
     * - Payment method distribution
     */
    const [
      revenueByStatus,
      revenueBySport,
      topRevenueVenues,
      paymentMethodStats
    ] = await Promise.all([
      // Revenue breakdown by booking status
      prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _sum: { totalAmount: true },
        _count: { status: true }
      }),

      // Revenue by sport type
      prisma.booking.groupBy({
        by: ['courtId'],
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true },
        _count: { courtId: true }
      }),

      // Top revenue generating venues
      prisma.booking.findMany({
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        include: {
          court: {
            include: {
              facility: {
                select: { id: true, name: true, city: true }
              }
            }
          }
        }
      }),

      // Payment methods (if payment data exists)
      prisma.payment.groupBy({
        by: ['method'],
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['COMPLETED'] }
        },
        _count: { method: true },
        _sum: { totalAmount: true }
      }).catch(() => []) // Handle if payment table doesn't exist
    ]);

    // Process sport revenue data
    let sportRevenue = {};
    if (revenueBySport.length > 0) {
      const courtIds = revenueBySport.map(r => r.courtId);
      const courts = await prisma.court.findMany({
        where: { id: { in: courtIds } },
        select: { id: true, sportType: true }
      });

      revenueBySport.forEach(revenue => {
        const court = courts.find(c => c.id === revenue.courtId);
        if (court) {
          const sport = court.sportType;
          if (!sportRevenue[sport]) {
            sportRevenue[sport] = { revenue: 0, bookings: 0 };
          }
          sportRevenue[sport].revenue += revenue._sum.totalAmount || 0;
          sportRevenue[sport].bookings += revenue._count.courtId || 0;
        }
      });
    }

    // Process venue revenue data
    let venueRevenue = {};
    topRevenueVenues.forEach(booking => {
      const venueId = booking.court.facility.id;
      const venueName = booking.court.facility.name;
      
      if (!venueRevenue[venueId]) {
        venueRevenue[venueId] = {
          id: venueId,
          name: venueName,
          city: booking.court.facility.city,
          revenue: 0,
          bookings: 0
        };
      }
      venueRevenue[venueId].revenue += booking.totalAmount;
      venueRevenue[venueId].bookings += 1;
    });

    // Sort and limit venue revenue
    const topVenues = Object.values(venueRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ==========================================
    // STEP 5: User Analytics
    // ==========================================
    /**
     * USER INSIGHTS:
     * - User registration trends
     * - User role distribution
     * - Most active users
     * - User retention metrics
     */
    const [
      usersByRole,
      dailyRegistrations,
      activeUsers,
      topUsers
    ] = await Promise.all([
      // User distribution by role
      prisma.user.groupBy({
        by: ['role'],
        where: { createdAt: { gte: startDate } },
        _count: { role: true }
      }),

      // Daily registration trend (last 30 days)
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM users 
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,

      // Active users (users with recent bookings)
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),

      // Top users by booking count
      prisma.user.findMany({
        include: {
          _count: {
            select: {
              bookings: {
                where: { createdAt: { gte: startDate } }
              }
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        },
        take: 10,
        where: {
          bookings: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      })
    ]);

    // ==========================================
    // STEP 6: Booking Analytics
    // ==========================================
    /**
     * BOOKING INSIGHTS:
     * - Booking status distribution
     * - Peak booking times
     * - Average booking value
     * - Cancellation rates
     */
    const [
      bookingsByStatus,
      bookingsByHour,
      bookingsByDay,
      avgBookingValue,
      cancellationRate
    ] = await Promise.all([
      // Booking status distribution
      prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: { status: true }
      }),

      // Peak hours analysis
      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM "bookingDate" + "startTime"::time) as hour,
               COUNT(*) as count
        FROM bookings 
        WHERE "createdAt" >= ${startDate}
        GROUP BY hour
        ORDER BY hour
      `,

      // Peak days analysis
      prisma.$queryRaw`
        SELECT EXTRACT(DOW FROM "bookingDate") as day_of_week,
               COUNT(*) as count
        FROM bookings 
        WHERE "createdAt" >= ${startDate}
        GROUP BY day_of_week
        ORDER BY day_of_week
      `,

      // Average booking value
      prisma.booking.aggregate({
        where: { 
          createdAt: { gte: startDate },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _avg: { totalAmount: true }
      }),

      // Cancellation rate
      prisma.booking.aggregate({
        where: { createdAt: { gte: startDate } },
        _count: { status: true }
      })
    ]);

    const totalBookingsForRate = cancellationRate._count.status;
    const cancelledBookings = bookingsByStatus.find(b => b.status === 'CANCELLED')?._count.status || 0;
    const calculatedCancellationRate = totalBookingsForRate > 0 
      ? (cancelledBookings / totalBookingsForRate * 100) 
      : 0;

    // ==========================================
    // STEP 7: Build Analytics Response
    // ==========================================
    const analytics = {
      period,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        id: admin.id,
        name: admin.name
      },

      // Overview metrics - flat structure for component compatibility
      overview: {
        totalUsers,
        totalVenues,
        totalBookings,
        totalRevenue: Math.round((totalRevenue._sum.totalAmount || 0) * 100) / 100,
        userGrowth: Math.round(userGrowth * 100) / 100,
        venueGrowth: Math.round(venueGrowth * 100) / 100,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        activeUsers,
        avgBookingValue: Math.round((avgBookingValue._avg.totalAmount || 0) * 100) / 100,
        pendingApprovals,
        pendingReports: pendingReports || 0,
        // New users and bookings today
        newUsersToday: periodUsers,
        bookingsToday: periodBookings
      },

      // Revenue analytics
      revenue: {
        byStatus: revenueByStatus.map(r => ({
          status: r.status,
          amount: r._sum.totalAmount || 0,
          count: r._count.status
        })),
        bySport: Object.entries(sportRevenue).map(([sport, data]) => ({
          sport,
          revenue: Math.round(data.revenue * 100) / 100,
          bookings: data.bookings
        })).sort((a, b) => b.revenue - a.revenue),
        topVenues,
        paymentMethods: paymentMethodStats.map(p => ({
          method: p.method,
          count: p._count.method,
          amount: p._sum.totalAmount || 0
        }))
      },

      // User analytics
      users: {
        byRole: usersByRole.map(u => ({
          role: u.role,
          count: u._count.role
        })),
        registrationTrend: dailyRegistrations.map(d => ({
          date: d.date,
          count: Number(d.count)
        })),
        topUsers: topUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          bookingCount: u._count.bookings
        }))
      },

      // Booking analytics
      bookings: {
        byStatus: bookingsByStatus.map(b => ({
          status: b.status,
          count: b._count.status,
          percentage: totalBookings > 0 ? Math.round((b._count.status / totalBookings) * 100) : 0
        })),
        peakHours: bookingsByHour.map(h => ({
          hour: Number(h.hour),
          count: Number(h.count)
        })),
        peakDays: bookingsByDay.map(d => ({
          dayOfWeek: Number(d.day_of_week),
          count: Number(d.count)
        })),
        cancellationRate: Math.round(calculatedCancellationRate * 100) / 100
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Analytics data retrieved successfully',
      data: { analytics }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to load analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}