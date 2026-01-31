/**
 * Owner Earnings API
 * GET /api/owner/earnings - Get owner's earnings summary and breakdown
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

/**
 * GET - Get owner's earnings summary
 */
export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // Only facility owners can access this
    if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Facility owners only.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year, all
    const venueId = searchParams.get('venueId');

    // Get date range based on period
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
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }

    // Get owner's facilities
    const facilities = await prisma.facility.findMany({
      where: {
        ownerId: user.id,
        status: 'APPROVED',
        ...(venueId && { id: venueId })
      },
      select: { id: true, name: true }
    });

    const facilityIds = facilities.map(f => f.id);

    if (facilityIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalEarnings: 0,
            totalBookings: 0,
            pendingPayouts: 0,
            totalRefunds: 0,
            netEarnings: 0
          },
          venues: [],
          recentTransactions: []
        }
      });
    }

    // Build date filter
    const dateFilter = startDate ? { completedAt: { gte: startDate } } : {};

    // Get completed payments for owner's venues
    const payments = await prisma.payment.findMany({
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
              select: {
                id: true,
                name: true,
                facilityId: true,
                facility: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        refunds: {
          where: { status: 'COMPLETED' }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    // Calculate totals
    let totalEarnings = 0;
    let totalRefunds = 0;
    const venueEarnings = {};

    payments.forEach(payment => {
      const baseAmount = payment.amount; // Exclude processing fee and GST
      totalEarnings += baseAmount;
      
      // Sum refunds
      payment.refunds.forEach(refund => {
        totalRefunds += refund.amount;
      });

      // Group by venue
      const venueId = payment.booking.court.facilityId;
      const venueName = payment.booking.court.facility.name;
      
      if (!venueEarnings[venueId]) {
        venueEarnings[venueId] = {
          id: venueId,
          name: venueName,
          earnings: 0,
          bookings: 0,
          refunds: 0
        };
      }
      
      venueEarnings[venueId].earnings += baseAmount;
      venueEarnings[venueId].bookings++;
      payment.refunds.forEach(refund => {
        venueEarnings[venueId].refunds += refund.amount;
      });
    });

    // Calculate platform fee (typically 10-15%)
    const platformFeeRate = 0.10; // 10%
    const platformFee = totalEarnings * platformFeeRate;
    const netEarnings = totalEarnings - platformFee - totalRefunds;

    // Get pending payouts (payments completed but not yet transferred)
    // This would typically integrate with a payout system
    const pendingPayouts = 0; // Placeholder

    // Get recent transactions
    const recentTransactions = payments.slice(0, 20).map(payment => ({
      id: payment.id,
      type: 'EARNING',
      amount: payment.amount,
      venueName: payment.booking.court.facility.name,
      courtName: payment.booking.court.name,
      bookingDate: payment.booking.bookingDate,
      completedAt: payment.completedAt,
      refunded: payment.refunds.reduce((sum, r) => sum + r.amount, 0)
    }));

    // Get daily breakdown for charts
    const dailyBreakdown = await getDailyEarnings(facilityIds, startDate, now);

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate,
          end: now
        },
        summary: {
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          totalBookings: payments.length,
          platformFee: parseFloat(platformFee.toFixed(2)),
          totalRefunds: parseFloat(totalRefunds.toFixed(2)),
          netEarnings: parseFloat(netEarnings.toFixed(2)),
          pendingPayouts
        },
        venues: Object.values(venueEarnings).map(v => ({
          ...v,
          earnings: parseFloat(v.earnings.toFixed(2)),
          refunds: parseFloat(v.refunds.toFixed(2)),
          netEarnings: parseFloat((v.earnings - v.refunds).toFixed(2))
        })),
        dailyBreakdown,
        recentTransactions
      }
    });

  } catch (error) {
    console.error('Get owner earnings error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load earnings data' },
      { status: 500 }
    );
  }
}

/**
 * Get daily earnings breakdown
 */
async function getDailyEarnings(facilityIds, startDate, endDate) {
  const results = [];
  const start = startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const daysDiff = Math.ceil((endDate - start) / (24 * 60 * 60 * 1000));
  
  // Limit to 30 days for performance
  const daysToFetch = Math.min(daysDiff, 30);
  
  for (let i = daysToFetch - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const dayStats = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        booking: {
          court: {
            facilityId: { in: facilityIds }
          }
        },
        completedAt: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    });
    
    results.push({
      date: dayStart.toISOString().split('T')[0],
      earnings: dayStats._sum.amount || 0,
      bookings: dayStats._count.id
    });
  }
  
  return results;
}
