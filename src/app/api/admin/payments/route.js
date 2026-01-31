/**
 * Admin Payment Management API
 * GET /api/admin/payments - Get all payments with filters
 * GET /api/admin/payments?analytics=true - Get payment analytics
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin";
import { prisma } from "../../../../lib/prisma";

/**
 * GET - Get all payments or analytics for admin
 */
export async function GET(request) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check for analytics request
    const isAnalytics = searchParams.get('analytics') === 'true';
    if (isAnalytics) {
      const analytics = await getPaymentAnalytics();
      return NextResponse.json({
        success: true,
        data: analytics
      });
    }

    // Pagination and filters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const userId = searchParams.get('userId');
    const venueId = searchParams.get('venueId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (method) {
      where.method = method;
    }
    
    if (userId) {
      where.userId = userId;
    }

    if (venueId) {
      where.booking = {
        court: {
          facilityId: venueId
        }
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount);
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          booking: {
            include: {
              court: {
                select: {
                  id: true,
                  name: true,
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
            select: {
              id: true,
              amount: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    // Get quick stats for header
    const quickStats = await prisma.payment.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        quickStats: {
          count: quickStats._count.id,
          totalAmount: quickStats._sum.totalAmount || 0
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin get payments error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load payments' },
      { status: 500 }
    );
  }
}

/**
 * Get comprehensive payment analytics
 */
async function getPaymentAnalytics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalPayments,
    completedPayments,
    failedPayments,
    refundedPayments,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalRefunds,
    paymentMethods,
    recentPayments,
    dailyRevenue,
    topVenues
  ] = await Promise.all([
    // Total payments count
    prisma.payment.count(),
    
    // Completed payments
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    
    // Failed payments
    prisma.payment.count({ where: { status: 'FAILED' } }),
    
    // Refunded payments
    prisma.payment.aggregate({
      where: { status: 'REFUNDED' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    
    // Today's revenue
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: today }
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    
    // This week's revenue
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: thisWeekStart }
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    
    // This month's revenue
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: thisMonthStart }
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    
    // Last month's revenue (for comparison)
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      },
      _sum: { totalAmount: true }
    }),
    
    // Total refunds
    prisma.refund.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true }
    }),
    
    // Payment methods distribution
    prisma.payment.groupBy({
      by: ['method'],
      where: { status: 'COMPLETED' },
      _count: { id: true },
      _sum: { totalAmount: true }
    }),
    
    // Recent payments
    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        booking: {
          include: {
            court: {
              select: {
                name: true,
                facility: { select: { name: true } }
              }
            }
          }
        }
      }
    }),
    
    // Daily revenue for last 30 days
    getDailyRevenue(30),
    
    // Top venues by revenue
    getTopVenuesByRevenue(5)
  ]);

  // Calculate growth percentage
  const monthGrowth = lastMonthRevenue._sum.totalAmount 
    ? ((monthRevenue._sum.totalAmount - lastMonthRevenue._sum.totalAmount) / lastMonthRevenue._sum.totalAmount * 100).toFixed(1)
    : 0;

  // Format payment methods
  const methodsDistribution = paymentMethods.reduce((acc, method) => {
    acc[method.method] = {
      count: method._count.id,
      amount: method._sum.totalAmount || 0
    };
    return acc;
  }, {});

  return {
    overview: {
      totalPayments,
      completedPayments: completedPayments._count.id,
      failedPayments,
      refundedPayments: refundedPayments._count.id,
      successRate: totalPayments > 0 
        ? parseFloat(((completedPayments._count.id / totalPayments) * 100).toFixed(1))
        : 0
    },
    revenue: {
      total: completedPayments._sum.totalAmount || 0,
      today: todayRevenue._sum.totalAmount || 0,
      thisWeek: weekRevenue._sum.totalAmount || 0,
      thisMonth: monthRevenue._sum.totalAmount || 0,
      lastMonth: lastMonthRevenue._sum.totalAmount || 0,
      monthGrowth: parseFloat(monthGrowth),
      avgTransactionValue: completedPayments._count.id > 0
        ? parseFloat((completedPayments._sum.totalAmount / completedPayments._count.id).toFixed(2))
        : 0
    },
    refunds: {
      totalCount: totalRefunds._count.id,
      totalAmount: totalRefunds._sum.amount || 0,
      refundRate: completedPayments._count.id > 0
        ? parseFloat(((refundedPayments._count.id / completedPayments._count.id) * 100).toFixed(1))
        : 0
    },
    paymentMethods: methodsDistribution,
    trends: {
      dailyRevenue
    },
    topVenues,
    recentPayments
  };
}

/**
 * Get daily revenue for last N days
 */
async function getDailyRevenue(days) {
  const results = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const dayRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    });
    
    results.push({
      date: startOfDay.toISOString().split('T')[0],
      revenue: dayRevenue._sum.totalAmount || 0,
      transactions: dayRevenue._count.id
    });
  }
  
  return results;
}

/**
 * Get top venues by revenue
 */
async function getTopVenuesByRevenue(limit) {
  const venues = await prisma.facility.findMany({
    where: { status: 'APPROVED' },
    include: {
      courts: {
        include: {
          bookings: {
            where: { status: 'COMPLETED' },
            include: {
              payment: {
                where: { status: 'COMPLETED' }
              }
            }
          }
        }
      }
    }
  });

  const venueRevenues = venues.map(venue => {
    let totalRevenue = 0;
    let totalBookings = 0;
    
    venue.courts.forEach(court => {
      court.bookings.forEach(booking => {
        if (booking.payment) {
          totalRevenue += booking.payment.totalAmount;
          totalBookings++;
        }
      });
    });
    
    return {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      totalRevenue,
      totalBookings
    };
  });

  return venueRevenues
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}
