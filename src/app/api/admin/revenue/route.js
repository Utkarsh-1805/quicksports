/**
 * ADMIN REVENUE ANALYTICS API
 * ===========================
 * 
 * GET /api/admin/revenue - Detailed revenue analytics and reporting
 * 
 * Provides comprehensive financial insights including:
 * - Revenue trends and growth analysis
 * - Revenue breakdown by venue, sport, time period
 * - Payment method analytics
 * - Refund and cancellation impact
 * - Forecasting and projections
 * 
 * @module api/admin/revenue
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMA
// ==========================================

const revenueQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  venueId: z.string().optional(),
  sportType: z.enum(['BADMINTON', 'TENNIS', 'FOOTBALL', 'CRICKET', 'BASKETBALL', 'TABLE_TENNIS', 'SWIMMING', 'SQUASH', 'VOLLEYBALL', 'OTHER']).optional(),
  includeProjections: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  includeRefunds: z.enum(['true', 'false']).default('true').transform(v => v === 'true')
}).refine((data) => {
  // If period is 'custom', both startDate and endDate must be provided
  if (data.period === 'custom') {
    return data.startDate && data.endDate;
  }
  return true;
}, {
  message: "Custom period requires both startDate and endDate in YYYY-MM-DD format",
  path: ["period"]
});

// Helper function to preprocess query parameters
function preprocessQueryParams(searchParams) {
  return {
    period: searchParams.get('period') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    venueId: searchParams.get('venueId') || undefined,
    sportType: searchParams.get('sportType') || undefined,
    includeProjections: searchParams.get('includeProjections') || undefined,
    includeRefunds: searchParams.get('includeRefunds') || undefined
  };
}

// ==========================================
// GET /api/admin/revenue
// ==========================================

/**
 * Get comprehensive revenue analytics
 * 
 * Query Parameters:
 * - period: Time period for analysis (default: 'month')
 * - startDate: Custom start date (YYYY-MM-DD)
 * - endDate: Custom end date (YYYY-MM-DD)
 * - venueId: Filter by specific venue
 * - sportType: Filter by sport type
 * - includeProjections: Include revenue forecasting (default: false)
 * - includeRefunds: Include refund analysis (default: true)
 * 
 * @requires Admin Role
 * 
 * @example
 * GET /api/admin/revenue?period=month&includeProjections=true
 * 
 * @returns {Object} Comprehensive revenue analytics
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
    
    const validationResult = revenueQuerySchema.safeParse(
      preprocessQueryParams(searchParams)
    );

    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.received || 'undefined'
      }));

      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid query parameters',
          details: errorDetails,
          validOptions: {
            period: ['day', 'week', 'month', 'quarter', 'year', 'custom'],
            sportType: ['BADMINTON', 'TENNIS', 'FOOTBALL', 'CRICKET', 'BASKETBALL', 'TABLE_TENNIS', 'SWIMMING', 'SQUASH', 'VOLLEYBALL', 'OTHER'],
            dateFormat: 'YYYY-MM-DD (e.g., 2024-01-15)',
            booleanValues: ['true', 'false']
          }
        },
        { status: 400 }
      );
    }

    const { 
      period, startDate, endDate, venueId, sportType, 
      includeProjections, includeRefunds 
    } = validationResult.data;

    // ==========================================
    // STEP 3: Calculate Date Ranges
    // ==========================================
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    if (period === 'custom' && startDate && endDate) {
      currentStart = new Date(startDate);
      currentEnd = new Date(endDate);
      const daysDiff = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
      previousStart = new Date(currentStart.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
      previousEnd = new Date(currentStart.getTime());
    } else {
      // Calculate periods based on preset options
      switch (period) {
        case 'day':
          currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          currentEnd = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);
          previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
          previousEnd = currentStart;
          break;
        case 'week':
          const weekStart = now.getDate() - now.getDay();
          currentStart = new Date(now.getFullYear(), now.getMonth(), weekStart);
          currentEnd = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEnd = currentStart;
          break;
        case 'month':
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousEnd = currentStart;
          break;
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          currentStart = new Date(now.getFullYear(), quarterMonth, 1);
          currentEnd = new Date(now.getFullYear(), quarterMonth + 3, 1);
          previousStart = new Date(now.getFullYear(), quarterMonth - 3, 1);
          previousEnd = currentStart;
          break;
        case 'year':
          currentStart = new Date(now.getFullYear(), 0, 1);
          currentEnd = new Date(now.getFullYear() + 1, 0, 1);
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          previousEnd = currentStart;
          break;
      }
    }

    // ==========================================
    // STEP 4: Build Query Conditions
    // ==========================================
    const baseWhere = {
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      createdAt: { gte: currentStart, lt: currentEnd }
    };

    // Add venue filter
    if (venueId) {
      baseWhere.court = {
        facilityId: venueId
      };
    }

    // Add sport filter
    if (sportType) {
      baseWhere.court = {
        ...baseWhere.court,
        sportType
      };
    }

    // ==========================================
    // STEP 5: Get Revenue Overview
    // ==========================================
    const [
      currentRevenue,
      previousRevenue,
      totalBookings,
      avgBookingValue,
      totalRefunds
    ] = await Promise.all([
      // Current period revenue
      prisma.booking.aggregate({
        where: baseWhere,
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Previous period for comparison
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          createdAt: { gte: previousStart, lt: previousEnd }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Total bookings count
      prisma.booking.count({ where: baseWhere }),

      // Average booking value
      prisma.booking.aggregate({
        where: baseWhere,
        _avg: { totalAmount: true }
      }),

      // Total refunds (if enabled)
      includeRefunds ? prisma.refund.aggregate({
        where: {
          createdAt: { gte: currentStart, lt: currentEnd },
          booking: venueId ? { court: { facilityId: venueId } } : {}
        },
        _sum: { amount: true },
        _count: { id: true }
      }) : { _sum: { amount: 0 }, _count: { id: 0 } }
    ]);

    // Calculate growth metrics
    const revenueGrowth = previousRevenue._sum.totalAmount > 0 
      ? (((currentRevenue._sum.totalAmount || 0) - previousRevenue._sum.totalAmount) / previousRevenue._sum.totalAmount) * 100
      : 0;

    const bookingsGrowth = previousRevenue._count.id > 0 
      ? ((currentRevenue._count.id - previousRevenue._count.id) / previousRevenue._count.id) * 100
      : 0;

    // ==========================================
    // STEP 6: Revenue by Time Period (Daily breakdown)
    // ==========================================
    let dailyRevenue = [];
    try {
      dailyRevenue = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          SUM("totalAmount") as revenue,
          COUNT(*) as bookings
        FROM bookings 
        WHERE status IN ('CONFIRMED', 'COMPLETED')
          AND "createdAt" >= ${currentStart}
          AND "createdAt" < ${currentEnd}
          ${venueId ? prisma.$queryRaw`AND "courtId" IN (
            SELECT id FROM courts WHERE "facilityId" = ${venueId}
          )` : prisma.$queryRaw``}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 31
      `;
    } catch (error) {
      console.error('Daily revenue query error:', error);
      dailyRevenue = [];
    }

    // ==========================================
    // STEP 7: Revenue by Venue
    // ==========================================
    const revenueByVenue = await prisma.booking.findMany({
      where: baseWhere,
      include: {
        court: {
          include: {
            facility: {
              select: { id: true, name: true, city: true }
            }
          }
        }
      }
    });

    // Process venue revenue data
    const venueRevenueMap = {};
    revenueByVenue.forEach(booking => {
      const venue = booking.court.facility;
      if (!venueRevenueMap[venue.id]) {
        venueRevenueMap[venue.id] = {
          id: venue.id,
          name: venue.name,
          city: venue.city,
          revenue: 0,
          bookings: 0
        };
      }
      venueRevenueMap[venue.id].revenue += booking.totalAmount;
      venueRevenueMap[venue.id].bookings += 1;
    });

    const topVenues = Object.values(venueRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ==========================================
    // STEP 8: Revenue by Sport Type
    // ==========================================
    let revenueBySport = [];
    try {
      revenueBySport = await prisma.booking.groupBy({
        by: ['courtId'],
        where: baseWhere,
        _sum: { totalAmount: true },
        _count: { courtId: true }
      }) || [];
    } catch (error) {
      console.error('Revenue by sport query error:', error);
      revenueBySport = [];
    }

    // Get sport types for the courts
    let sportRevenueData = {};
    if (revenueBySport.length > 0) {
      const courtIds = revenueBySport.map(r => r.courtId);
      const courts = await prisma.court.findMany({
        where: { id: { in: courtIds } },
        select: { id: true, sportType: true }
      });

      revenueBySport.forEach(revenue => {
        const court = courts.find(c => c.id === revenue.courtId);
        if (court) {
          if (!sportRevenueData[court.sportType]) {
            sportRevenueData[court.sportType] = { revenue: 0, bookings: 0 };
          }
          sportRevenueData[court.sportType].revenue += revenue._sum.totalAmount || 0;
          sportRevenueData[court.sportType].bookings += revenue._count.courtId;
        }
      });
    }

    const sportRevenue = Object.entries(sportRevenueData)
      .map(([sport, data]) => ({
        sport,
        revenue: Math.round(data.revenue * 100) / 100,
        bookings: data.bookings,
        avgBookingValue: Math.round((data.revenue / data.bookings) * 100) / 100
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ==========================================
    // STEP 9: Payment Method Analysis
    // ==========================================
    let paymentMethodStats = [];
    try {
      paymentMethodStats = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: currentStart, lt: currentEnd }
        },
        _count: { method: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      }) || [];
    } catch (error) {
      console.error('Payment method stats error:', error);
      paymentMethodStats = [];
    }

    // ==========================================
    // STEP 10: Revenue Projections (if requested)
    // ==========================================
    let projections = null;
    if (includeProjections) {
      // Simple linear projection based on current growth
      const daysInPeriod = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
      const dailyAverage = (currentRevenue._sum.totalAmount || 0) / daysInPeriod;
      
      projections = {
        dailyAverage: Math.round(dailyAverage * 100) / 100,
        projectedMonthly: Math.round(dailyAverage * 30 * 100) / 100,
        projectedQuarterly: Math.round(dailyAverage * 90 * 100) / 100,
        projectedYearly: Math.round(dailyAverage * 365 * 100) / 100,
        growthTrend: revenueGrowth > 0 ? 'positive' : revenueGrowth < 0 ? 'negative' : 'stable',
        confidence: Math.abs(revenueGrowth) > 10 ? 'high' : Math.abs(revenueGrowth) > 5 ? 'medium' : 'low'
      };
    }

    // ==========================================
    // STEP 11: Build Response
    // ==========================================
    const analytics = {
      period,
      dateRange: {
        start: currentStart.toISOString().split('T')[0],
        end: currentEnd.toISOString().split('T')[0]
      },
      
      overview: {
        totalRevenue: Math.round((currentRevenue._sum.totalAmount || 0) * 100) / 100,
        totalBookings: currentRevenue._count.id,
        avgBookingValue: Math.round((avgBookingValue._avg.totalAmount || 0) * 100) / 100,
        totalRefunds: includeRefunds ? Math.round((totalRefunds._sum.amount || 0) * 100) / 100 : null,
        netRevenue: includeRefunds 
          ? Math.round(((currentRevenue._sum.totalAmount || 0) - (totalRefunds._sum.amount || 0)) * 100) / 100 
          : Math.round((currentRevenue._sum.totalAmount || 0) * 100) / 100
      },

      growth: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        bookingsGrowth: Math.round(bookingsGrowth * 100) / 100,
        previousPeriod: {
          revenue: Math.round((previousRevenue._sum.totalAmount || 0) * 100) / 100,
          bookings: previousRevenue._count.id
        }
      },

      breakdown: {
        byTime: (dailyRevenue || []).map(day => ({
          date: day.date,
          revenue: Math.round(Number(day.revenue || 0) * 100) / 100,
          bookings: Number(day.bookings || 0)
        })),
        byVenue: topVenues || [],
        bySport: sportRevenue || [],
        byPaymentMethod: (paymentMethodStats || []).map(p => ({
          method: p.method,
          count: p._count.method || 0,
          totalAmount: Math.round((p._sum.totalAmount || 0) * 100) / 100,
          avgAmount: Math.round((p._avg.totalAmount || 0) * 100) / 100
        }))
      },

      ...(includeProjections && { projections })
    };

    return NextResponse.json({
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: { analytics }
    });

  } catch (error) {
    console.error('Admin revenue analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to load revenue analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}