/**
 * Admin Refund Management API
 * GET /api/admin/refunds - Get all refunds with filters
 * POST /api/admin/refunds - Process admin-initiated refund
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";
import PaymentService from "@/services/payment.service";

/**
 * GET - Get all refunds with filters
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
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [refunds, total, stats] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          payment: {
            select: {
              id: true,
              razorpayPaymentId: true,
              totalAmount: true,
              method: true
            }
          },
          booking: {
            include: {
              court: {
                select: {
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
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.refund.count({ where }),
      prisma.refund.aggregate({
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    // Get status breakdown
    const statusBreakdown = await prisma.refund.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });

    const formattedStatus = statusBreakdown.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count.id,
        amount: item._sum.amount || 0
      };
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        refunds,
        stats: {
          totalRefunds: stats._count.id,
          totalAmount: stats._sum.amount || 0,
          byStatus: formattedStatus
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
    console.error('Admin get refunds error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load refunds' },
      { status: 500 }
    );
  }
}

/**
 * POST - Process admin-initiated refund (for special cases)
 */
export async function POST(request) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const admin = adminResult.user;
    const body = await request.json();

    const { paymentId, amount, reason, notes } = body;

    if (!paymentId || !reason) {
      return NextResponse.json(
        { success: false, message: 'paymentId and reason are required' },
        { status: 400 }
      );
    }

    // Convert amount to number if provided
    const requestedAmount = amount ? parseFloat(amount) : null;

    if (requestedAmount !== null && (isNaN(requestedAmount) || requestedAmount <= 0)) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
        refunds: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'Only completed payments can be refunded' },
        { status: 400 }
      );
    }

    // Check existing refunds
    const existingRefundTotal = payment.refunds
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);

    const maxRefundable = payment.totalAmount - existingRefundTotal;
    const refundAmount = requestedAmount || maxRefundable;

    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Maximum refundable amount is ₹${maxRefundable.toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    // Process refund through payment gateway
    const refundResult = await PaymentService.processRefund({
      paymentId: payment.razorpayPaymentId,
      amount: refundAmount,
      reason: `Admin refund: ${reason}`,
      notes: {
        bookingId: payment.bookingId,
        adminId: admin.id,
        adminName: admin.name,
        isAdminInitiated: true,
        ...notes
      }
    });

    if (!refundResult.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to process refund', details: refundResult.error },
        { status: 500 }
      );
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        razorpayRefundId: refundResult.refund.id,
        amount: refundAmount,
        originalAmount: payment.totalAmount,
        refundPercentage: Math.round((refundAmount / payment.totalAmount) * 100),
        status: 'COMPLETED',
        reason: `Admin: ${reason}`,
        notes: {
          adminId: admin.id,
          adminName: admin.name,
          isAdminInitiated: true,
          additionalNotes: notes
        },
        processedAt: new Date()
      }
    });

    // Update payment status if fully refunded
    const totalRefunded = existingRefundTotal + refundAmount;
    if (totalRefunded >= payment.totalAmount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${refundAmount.toFixed(2)} processed successfully`,
      data: {
        refund,
        remainingRefundable: maxRefundable - refundAmount
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Admin process refund error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
