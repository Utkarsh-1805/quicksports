/**
 * PAYMENT ORDER API
 * ================
 * 
 * POST /api/bookings/{id}/pay
 * 
 * Creates payment order for a specific booking.
 * 
 * FLOW:
 * 1. Validate booking exists and belongs to user
 * 2. Check if booking is payable (PENDING status)
 * 3. Calculate total amount with fees
 * 4. Create Razorpay order
 * 5. Store payment details in database
 * 6. Return order details for frontend
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PaymentService from '@/services/payment.service';

// Valid payment methods
const VALID_PAYMENT_METHODS = ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'EMI'];

export async function POST(request, { params }) {
  let userId;
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }
    userId = authResult.user.id;

    // Get booking ID from params (await required in Next.js 15+)
    const { id: bookingId } = await params;

    // Parse request body
    const body = await request.json();
    
    // Manual validation instead of Zod
    const { paymentMethod, notes } = body;
    
    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: 'paymentMethod must be one of: CARD, UPI, NET_BANKING, WALLET, EMI'
      }, { status: 400 });
    }

    // Fetch booking details
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: userId,
        status: 'PENDING' // Only allow payment for pending bookings
      },
      include: {
        court: {
          include: {
            facility: true
          }
        },
        timeSlot: true
      }
    });

    if (!booking) {
      // Debug: Check if booking exists at all
      const anyBooking = await prisma.booking.findFirst({
        where: { id: bookingId }
      });
      
      let reason = 'Booking not found';
      if (anyBooking) {
        if (anyBooking.userId !== userId) {
          reason = 'Booking belongs to different user';
        } else if (anyBooking.status !== 'PENDING') {
          reason = `Booking status is ${anyBooking.status}, only PENDING bookings can be paid`;
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Booking not found or not available for payment',
        reason: reason,
        debug: { bookingId, userId, bookingExists: !!anyBooking }
      }, { status: 404 });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId: bookingId,
        status: {
          in: ['PENDING', 'COMPLETED']
        }
      }
    });

    if (existingPayment) {
      return NextResponse.json({
        success: false,
        error: 'Payment already initiated or completed for this booking'
      }, { status: 409 });
    }

    // Create payment order with Razorpay
    const orderResult = await PaymentService.createOrder({
      bookingId: bookingId,
      amount: booking.totalAmount,
      currency: 'INR',
      notes: {
        facilityName: booking.court.facility.name,
        courtName: booking.court.name,
        bookingDate: booking.bookingDate.toISOString(),
        timeSlot: `${booking.startTime} - ${booking.endTime}`,
        ...notes
      }
    });

    if (!orderResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create payment order',
        details: orderResult.error
      }, { status: 500 });
    }

    // Store payment record in database
    const payment = await prisma.payment.create({
      data: {
        id: orderResult.order.orderId,
        booking: {
          connect: { id: bookingId }
        },
        user: {
          connect: { id: userId }
        },
        razorpayOrderId: orderResult.order.razorpayOrderId,
        amount: booking.totalAmount,
        processingFee: orderResult.order.feeBreakdown.processingFee,
        gst: orderResult.order.feeBreakdown.gst,
        totalAmount: orderResult.order.feeBreakdown.totalAmount,
        currency: 'INR',
        method: paymentMethod,
        status: 'PENDING',
        notes: notes || {}
      }
    });

    // Prepare response data
    const responseData = {
      success: true,
      data: {
        paymentId: payment.id,
        razorpayOrderId: orderResult.order.razorpayOrderId,
        amount: orderResult.order.amount, // Amount in paise for Razorpay
        currency: orderResult.order.currency,
        feeBreakdown: orderResult.order.feeBreakdown,
        booking: {
          id: booking.id,
          facilityName: booking.court.facility.name,
          courtName: booking.court.name,
          date: booking.bookingDate,
          time: `${booking.startTime} - ${booking.endTime}`,
          duration: booking.duration,
          originalAmount: booking.totalAmount
        },
        razorpayConfig: {
          key: process.env.RAZORPAY_KEY_ID,
          orderId: orderResult.order.razorpayOrderId,
          amount: orderResult.order.amount,
          currency: orderResult.order.currency,
          name: 'QuickCourt',
          description: `Court booking at ${booking.court.facility.name}`,
          prefill: {
            name: '', // Will be filled by frontend from user data
            email: '', // Will be filled by frontend from user data
            contact: '' // Will be filled by frontend from user data
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal dismissed');
            }
          }
        },
        actions: {
          verifyPayment: `/api/payments/verify`,
          getStatus: `/api/bookings/${bookingId}/payment-status`,
          cancelPayment: `/api/payments/${payment.id}/cancel`
        }
      }
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Payment order creation error:', error);
    
    // Clean up failed payment record if it was created
    if (userId) {
      try {
        const { id: cleanupBookingId } = await params;
        await prisma.payment.deleteMany({
          where: {
            bookingId: cleanupBookingId,
            userId: userId,
            status: 'PENDING',
            razorpayOrderId: null // Only delete if order creation failed
          }
        });
      } catch (cleanupError) {
        console.error('Payment cleanup error:', cleanupError);
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/bookings/{id}/pay
 * 
 * Get current payment status for a booking
 */
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;

    // Get payment status
    const payment = await prisma.payment.findFirst({
      where: {
        bookingId: bookingId,
        userId: authResult.user.id
      },
      include: {
        booking: {
          include: {
            court: {
              include: {
                facility: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'No payment found for this booking'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        processingFee: payment.processingFee,
        gst: payment.gst,
        method: payment.method,
        razorpayPaymentId: payment.razorpayPaymentId,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        booking: {
          id: payment.booking.id,
          status: payment.booking.status,
          facilityName: payment.booking.court.facility.name,
          courtName: payment.booking.court.name,
          date: payment.booking.bookingDate,
          time: `${payment.booking.startTime} - ${payment.booking.endTime}`
        }
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}