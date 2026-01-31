/**
 * Payment Status API
 * GET /api/payments/[id] - Get payment status and details
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

/**
 * GET - Get payment status and details
 */
export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const { id } = await params;

    // Find payment - users can only see their own, admins can see all
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        ...(user.role !== 'ADMIN' && { userId: user.id })
      },
      include: {
        booking: {
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
        },
        refunds: {
          select: {
            id: true,
            amount: true,
            status: true,
            reason: true,
            createdAt: true,
            processedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Calculate refund summary
    const refundSummary = {
      totalRefunded: payment.refunds
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.amount, 0),
      pendingRefunds: payment.refunds
        .filter(r => r.status === 'PENDING')
        .reduce((sum, r) => sum + r.amount, 0),
      refundCount: payment.refunds.length
    };

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          amount: payment.amount,
          processingFee: payment.processingFee,
          gst: payment.gst,
          totalAmount: payment.totalAmount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt
        },
        booking: {
          id: payment.booking.id,
          date: payment.booking.bookingDate,
          startTime: payment.booking.startTime,
          endTime: payment.booking.endTime,
          status: payment.booking.status,
          court: payment.booking.court,
          venue: payment.booking.court.facility
        },
        refunds: payment.refunds,
        refundSummary,
        netAmount: payment.totalAmount - refundSummary.totalRefunded
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load payment details' },
      { status: 500 }
    );
  }
}
