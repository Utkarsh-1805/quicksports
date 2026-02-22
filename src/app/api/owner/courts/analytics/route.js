/**
 * FACILITY OWNER COURT ANALYTICS API
 * ==================================
 * 
 * GET /api/owner/courts/analytics - Get detailed analytics for owner's courts
 * GET /api/owner/courts/[courtId]/analytics - Get analytics for specific court
 * 
 * Provides comprehensive analytics including:
 * - Court utilization rates
 * - Revenue per court
 * - Peak usage hours
 * - Booking patterns
 * - Performance comparisons
 * - Maintenance schedules impact
 * 
 * @module api/owner/courts/analytics
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

/**
 * GET /api/owner/courts/analytics
 * 
 * Get analytics for all owner's courts
 * 
 * Query Parameters:
 * - period: 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 * - venueId: Filter by specific venue (optional)
 * - comparePrevious: boolean (default: true) - Compare with previous period
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
    const comparePrevious = searchParams.get('comparePrevious') !== 'false';

    // Calculate date ranges
    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEndDate = startDate;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = startDate;
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        endDate = now;
        prevStartDate = new Date(now.getFullYear(), quarterMonth - 3, 1);
        prevEndDate = startDate;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
        prevEndDate = startDate;
        break;
      default:
        startDate = new Date(0);
        endDate = now;
        prevStartDate = null;
        prevEndDate = null;
    }

    // ==========================================
    // STEP 3: Get Owner's Courts
    // ==========================================
    const venueFilter = venueId ? { id: venueId } : {};
    
    const courts = await prisma.court.findMany({
      where: {
        facility: {
          ownerId: user.id,
          ...venueFilter
        },
        isActive: true
      },
      include: {
        facility: {
          select: { id: true, name: true, city: true }
        }
      }
    });

    if (courts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          courts: [],
          summary: {
            totalCourts: 0,
            avgUtilization: 0,
            totalRevenue: 0,
            avgRevenuePerCourt: 0
          }
        }
      });
    }

    const courtIds = courts.map(c => c.id);

    // ==========================================
    // STEP 4: Get Booking Analytics
    // ==========================================
    const [currentBookings, previousBookings] = await Promise.all([
      prisma.booking.findMany({
        where: {
          courtId: { in: courtIds },
          createdAt: { gte: startDate, lte: endDate }
        },
        include: {
          payment: {
            select: { totalAmount: true, status: true }
          }
        }
      }),
      
      comparePrevious && prevStartDate ? prisma.booking.findMany({
        where: {
          courtId: { in: courtIds },
          createdAt: { gte: prevStartDate, lte: prevEndDate }
        },
        include: {
          payment: {
            select: { totalAmount: true, status: true }
          }
        }
      }) : Promise.resolve([])
    ]);

    // ==========================================
    // STEP 5: Calculate Court Metrics
    // ==========================================
    const courtAnalytics = courts.map(court => {
      const courtBookings = currentBookings.filter(b => b.courtId === court.id);
      const prevCourtBookings = previousBookings.filter(b => b.courtId === court.id);
      
      // Revenue calculation
      const revenue = courtBookings
        .filter(b => b.payment?.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.payment?.totalAmount || 0), 0);
        
      const prevRevenue = prevCourtBookings
        .filter(b => b.payment?.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.payment?.totalAmount || 0), 0);

      // Booking counts by status
      const bookingsByStatus = courtBookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {});

      // Calculate utilization rate (simplified: booked hours / available hours)
      const totalBookings = courtBookings.length;
      const avgBookingHours = courtBookings.reduce((sum, b) => sum + (b.duration || 60), 0) / 60; // Convert to hours
      
      // Assume 16 operating hours per day
      const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const availableHours = daysInPeriod * 16;
      const utilization = availableHours > 0 ? (avgBookingHours / availableHours) * 100 : 0;

      // Peak hours analysis
      const hourlyBookings = courtBookings.reduce((acc, booking) => {
        const hour = parseInt(booking.startTime.split(':')[0]);
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const peakHour = Object.entries(hourlyBookings)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 1)
        .map(([hour, count]) => ({ hour: parseInt(hour), bookings: count }))[0];

      // Growth calculations
      const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const bookingGrowth = prevCourtBookings.length > 0 ? 
        ((totalBookings - prevCourtBookings.length) / prevCourtBookings.length) * 100 : 0;

      return {
        courtId: court.id,
        courtName: court.name,
        sportType: court.sportType,
        pricePerHour: court.pricePerHour,
        facility: {
          id: court.facility.id,
          name: court.facility.name,
          city: court.facility.city
        },
        metrics: {
          totalBookings,
          totalRevenue: Math.round(revenue * 100) / 100,
          utilizationRate: Math.round(utilization * 10) / 10,
          avgRevenuePerBooking: totalBookings > 0 ? Math.round((revenue / totalBookings) * 100) / 100 : 0,
          bookingsByStatus,
          peakHour,
          hourlyDistribution: hourlyBookings
        },
        growth: comparePrevious ? {
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          bookingGrowth: Math.round(bookingGrowth * 10) / 10,
          previousPeriod: {
            bookings: prevCourtBookings.length,
            revenue: Math.round(prevRevenue * 100) / 100
          }
        } : null
      };
    });

    // ==========================================
    // STEP 6: Calculate Summary Metrics
    // ==========================================
    const totalRevenue = courtAnalytics.reduce((sum, c) => sum + c.metrics.totalRevenue, 0);
    const avgUtilization = courtAnalytics.length > 0 ? 
      courtAnalytics.reduce((sum, c) => sum + c.metrics.utilizationRate, 0) / courtAnalytics.length : 0;
    
    const summary = {
      totalCourts: courts.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgUtilization: Math.round(avgUtilization * 10) / 10,
      avgRevenuePerCourt: Math.round((totalRevenue / courts.length) * 100) / 100,
      totalBookings: courtAnalytics.reduce((sum, c) => sum + c.metrics.totalBookings, 0)
    };

    // ==========================================
    // STEP 7: Top Performers
    // ==========================================
    const topPerformers = {
      byRevenue: [...courtAnalytics]
        .sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue)
        .slice(0, 5),
      byUtilization: [...courtAnalytics]
        .sort((a, b) => b.metrics.utilizationRate - a.metrics.utilizationRate)
        .slice(0, 5),
      byBookings: [...courtAnalytics]
        .sort((a, b) => b.metrics.totalBookings - a.metrics.totalBookings)
        .slice(0, 5)
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        courts: courtAnalytics,
        topPerformers,
        period: period,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Court analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load court analytics' },
      { status: 500 }
    );
  }
}