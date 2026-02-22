/**
 * INDIVIDUAL COURT ANALYTICS API
 * ==============================
 * 
 * GET /api/owner/courts/[courtId]/analytics - Get detailed analytics for a specific court
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../lib/auth";
import prisma from "../../../../../lib/prisma";

/**
 * GET /api/owner/courts/[courtId]/analytics
 * 
 * Get detailed analytics for a specific court
 * 
 * Query Parameters:
 * - period: 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 * - includeHeatmap: boolean (default: true) - Include booking heatmap
 * - includeTrends: boolean (default: true) - Include trend analysis
 * 
 * @requires Authentication
 * @requires Facility Owner Role
 */
export async function GET(request, { params }) {
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
    const { courtId } = await params;

    // ==========================================
    // STEP 2: Verify Court Ownership
    // ==========================================
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: {
          select: {
            id: true,
            ownerId: true,
            name: true,
            city: true
          }
        }
      }
    });

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    if (court.facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. You can only view analytics for your own courts.' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 3: Parse Query Parameters
    // ==========================================
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const includeHeatmap = searchParams.get('includeHeatmap') !== 'false';
    const includeTrends = searchParams.get('includeTrends') !== 'false';

    // Calculate date ranges
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // ==========================================
    // STEP 4: Get Booking Data
    // ==========================================
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: courtId,
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        payment: {
          select: { totalAmount: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ==========================================
    // STEP 5: Calculate Basic Metrics
    // ==========================================
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
    
    const totalRevenue = bookings
      .filter(b => b.payment?.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.payment?.totalAmount || 0), 0);

    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Cancellation rate
    const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

    // ==========================================
    // STEP 6: Booking Patterns Analysis
    // ==========================================
    
    // Day of week distribution
    const dayOfWeekBookings = bookings.reduce((acc, booking) => {
      const dayOfWeek = booking.bookingDate.getDay();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[dayOfWeek];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {});

    // Hour distribution
    const hourDistribution = bookings.reduce((acc, booking) => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Peak hours (top 3)
    const peakHours = Object.entries(hourDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        bookings: count,
        percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0
      }));

    // ==========================================
    // STEP 7: Booking Heatmap (if requested)
    // ==========================================
    let heatmapData = null;
    
    if (includeHeatmap) {
      const heatmap = {};
      
      bookings.forEach(booking => {
        const day = booking.bookingDate.getDay();
        const hour = parseInt(booking.startTime.split(':')[0]);
        
        if (!heatmap[day]) heatmap[day] = {};
        heatmap[day][hour] = (heatmap[day][hour] || 0) + 1;
      });

      heatmapData = heatmap;
    }

    // ==========================================
    // STEP 8: Trend Analysis (if requested)
    // ==========================================
    let trendData = null;
    
    if (includeTrends) {
      // Group bookings by date for trend analysis
      const dailyBookings = {};
      const dailyRevenue = {};
      
      bookings.forEach(booking => {
        const dateStr = booking.createdAt.toISOString().split('T')[0];
        dailyBookings[dateStr] = (dailyBookings[dateStr] || 0) + 1;
        
        if (booking.payment?.status === 'COMPLETED') {
          dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + (booking.payment.totalAmount || 0);
        }
      });

      // Generate trend arrays
      const trendDates = [];
      const bookingCounts = [];
      const revenueCounts = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        trendDates.push(dateStr);
        bookingCounts.push(dailyBookings[dateStr] || 0);
        revenueCounts.push(dailyRevenue[dateStr] || 0);
      }

      trendData = {
        dates: trendDates,
        bookings: bookingCounts,
        revenue: revenueCounts
      };
    }

    // ==========================================
    // STEP 9: Customer Analysis
    // ==========================================
    const customerAnalysis = {};
    const customerBookings = {};
    
    bookings.forEach(booking => {
      const userId = booking.user?.email || 'Unknown';
      customerBookings[userId] = (customerBookings[userId] || 0) + 1;
    });

    const repeatCustomers = Object.values(customerBookings).filter(count => count > 1).length;
    const totalUniqueCustomers = Object.keys(customerBookings).length;
    const repeatCustomerRate = totalUniqueCustomers > 0 ? (repeatCustomers / totalUniqueCustomers) * 100 : 0;

    // Top customers
    const topCustomers = Object.entries(customerBookings)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([email, bookingCount]) => ({
        email,
        bookingCount,
        revenue: bookings
          .filter(b => b.user?.email === email && b.payment?.status === 'COMPLETED')
          .reduce((sum, b) => sum + (b.payment?.totalAmount || 0), 0)
      }));

    // ==========================================
    // STEP 10: Maintenance Impact
    // ==========================================
    const blockedSlots = await prisma.timeSlot.findMany({
      where: {
        courtId: courtId,
        isBlocked: true,
        date: { gte: startDate, lte: endDate }
      }
    });

    const maintenanceHours = blockedSlots.length; // Simplified calculation
    
    return NextResponse.json({
      success: true,
      data: {
        court: {
          id: court.id,
          name: court.name,
          sportType: court.sportType,
          pricePerHour: court.pricePerHour,
          facility: court.facility
        },
        overview: {
          totalBookings,
          confirmedBookings: confirmedBookings.length,
          cancelledBookings: cancelledBookings.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          avgBookingValue: Math.round(avgBookingValue * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 10) / 10,
          uniqueCustomers: totalUniqueCustomers,
          repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10
        },
        patterns: {
          dayOfWeek: dayOfWeekBookings,
          hourDistribution,
          peakHours
        },
        customers: {
          total: totalUniqueCustomers,
          repeat: repeatCustomers,
          repeatRate: Math.round(repeatCustomerRate * 10) / 10,
          topCustomers
        },
        maintenance: {
          blockedSlots: blockedSlots.length,
          maintenanceHours,
          impactOnRevenue: maintenanceHours * court.pricePerHour
        },
        ...(heatmapData && { heatmap: heatmapData }),
        ...(trendData && { trends: trendData }),
        period,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('Individual court analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load court analytics' },
      { status: 500 }
    );
  }
}