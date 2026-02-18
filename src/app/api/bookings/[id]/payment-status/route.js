/**
 * GET /api/bookings/[id]/payment-status
 * 
 * Get payment status for a specific booking
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }

    // Handle params properly for Next.js App Router
    const resolvedParams = await params;
    const { id: bookingId } = resolvedParams;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Find booking with payment details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        user: true,
        court: {
          include: {
            facility: true
          }
        },
        timeSlot: true,
        refunds: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user owns this booking or is admin
    if (booking.userId !== authResult.user.id && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const payment = booking.payment;
    
    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingStatus: booking.status,
        paymentStatus: payment?.status || 'PENDING',
        paymentMethod: payment?.method,
        amount: payment?.amount,
        totalAmount: payment?.totalAmount,
        processingFee: payment?.processingFee,
        gst: payment?.gst,
        razorpayPaymentId: payment?.razorpayPaymentId,
        razorpayOrderId: payment?.razorpayOrderId,
        createdAt: payment?.createdAt,
        completedAt: payment?.completedAt,
        booking: {
          facilityName: booking.court.facility.name,
          courtName: booking.court.name,
          date: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          totalAmount: booking.totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}