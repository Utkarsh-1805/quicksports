/**
 * Payment Receipt/Invoice API
 * GET /api/payments/[id]/receipt - Get payment receipt details
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Get payment receipt/invoice details
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

    // Find payment with all related data
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        // Allow user to see their own receipts, or admin to see all
        ...(user.role !== 'ADMIN' && { userId: user.id })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
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
                    state: true,
                    pincode: true,
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

    // Generate receipt data
    const receipt = {
      receiptNumber: `RCP-${payment.id.slice(-8).toUpperCase()}`,
      invoiceNumber: `INV-${new Date(payment.createdAt).getFullYear()}-${payment.id.slice(-6).toUpperCase()}`,
      paymentId: payment.id,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,

      // Customer details
      customer: {
        name: payment.user.name,
        email: payment.user.email,
        phone: payment.user.phone
      },

      // Venue details
      venue: {
        name: payment.booking.court.facility.name,
        address: payment.booking.court.facility.address,
        city: payment.booking.court.facility.city,
        state: payment.booking.court.facility.state,
        pincode: payment.booking.court.facility.pincode
      },

      // Booking details
      booking: {
        id: payment.booking.id,
        courtName: payment.booking.court.name,
        sportType: payment.booking.court.sportType,
        date: payment.booking.bookingDate,
        startTime: payment.booking.startTime,
        endTime: payment.booking.endTime,
        duration: payment.booking.duration
      },

      // Payment breakdown
      payment: {
        baseAmount: payment.amount,
        processingFee: payment.processingFee,
        gst: payment.gst,
        totalAmount: payment.totalAmount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status
      },

      // Refund details if any
      refunds: payment.refunds.map(refund => ({
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
        date: refund.processedAt || refund.createdAt
      })),

      // Net amount after refunds
      netAmount: payment.totalAmount - payment.refunds
        .filter(r => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.amount, 0),

      // Timestamps
      paymentDate: payment.createdAt,
      completedAt: payment.completedAt,
      generatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: { receipt }
    });

  } catch (error) {
    console.error('Get receipt error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
