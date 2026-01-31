/**
 * Payment History API
 * GET /api/users/me/payments - Get current user's payment history
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

/**
 * GET - Get user's payment history
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
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status'); // PENDING, COMPLETED, FAILED, REFUNDED
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = { userId: user.id };
    
    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payments, total, stats] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              court: {
                select: {
                  id: true,
                  name: true,
                  facility: {
                    select: {
                      id: true,
                      name: true,
                      city: true
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
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { userId: user.id },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Calculate completed amount
    const completedStats = await prisma.payment.aggregate({
      where: { userId: user.id, status: 'COMPLETED' },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    // Calculate refunded amount
    const refundedStats = await prisma.refund.aggregate({
      where: { userId: user.id, status: 'COMPLETED' },
      _sum: { amount: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        stats: {
          totalPayments: stats._count.id,
          totalSpent: completedStats._sum.totalAmount || 0,
          successfulPayments: completedStats._count.id,
          totalRefunded: refundedStats._sum.amount || 0
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
    console.error('Get payment history error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load payment history' },
      { status: 500 }
    );
  }
}
