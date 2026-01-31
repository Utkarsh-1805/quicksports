/**
 * Admin Individual Payment Management API
 * GET /api/admin/payments/[id] - Get payment details
 * PUT /api/admin/payments/[id] - Update payment status (manual intervention)
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { prisma } from "../../../../../lib/prisma";

/**
 * GET - Get detailed payment information
 */
export async function GET(request, { params }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        booking: {
          include: {
            court: {
              include: {
                facility: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    owner: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            timeSlot: true
          }
        },
        refunds: {
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

    // Get user's payment history summary
    const userPaymentStats = await prisma.payment.aggregate({
      where: { userId: payment.userId },
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // Get gateway response if stored
    const gatewayInfo = payment.gatewayResponse || null;

    return NextResponse.json({
      success: true,
      data: {
        payment,
        userStats: {
          totalPayments: userPaymentStats._count.id,
          totalSpent: userPaymentStats._sum.totalAmount || 0
        },
        gatewayInfo
      }
    });

  } catch (error) {
    console.error('Admin get payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load payment details' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Manual payment status update (admin intervention)
 * Used for resolving payment disputes or manual corrections
 */
export async function PUT(request, { params }) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) {
      return NextResponse.json(
        { success: false, message: adminResult.error },
        { status: adminResult.status }
      );
    }

    const admin = adminResult.user;
    const { id } = await params;
    const body = await request.json();

    const { status, reason, notes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'Reason is required for manual status update' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    const previousStatus = payment.status;

    // Update payment and related records in transaction
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status,
          notes: {
            ...(payment.notes || {}),
            adminUpdate: {
              previousStatus,
              newStatus: status,
              reason,
              adminId: admin.id,
              adminName: admin.name,
              timestamp: new Date(),
              additionalNotes: notes || null
            }
          },
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        }
      });

      // Update booking status if payment status changed
      if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { 
            status: 'CONFIRMED',
            confirmedAt: new Date()
          }
        });
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { 
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: `Payment ${status.toLowerCase()} - Admin: ${reason}`
          }
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Payment status updated from ${previousStatus} to ${status}`,
      data: { payment: updatedPayment }
    });

  } catch (error) {
    console.error('Admin update payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
