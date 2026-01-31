/**
 * REFUND PROCESSING API
 * ====================
 * 
 * POST /api/payments/refund
 * 
 * Processes refunds for cancelled bookings.
 * 
 * FLOW:
 * 1. Validate refund request and eligibility
 * 2. Calculate refund amount based on policy
 * 3. Process refund through payment gateway
 * 4. Update payment and booking records
 * 5. Create refund record
 * 6. Send refund confirmation
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PaymentService from '@/services/payment.service';

export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Manual validation instead of Zod
    const { paymentId, reason, notes } = body;
    
    if (!paymentId || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Invalid refund request',
        details: 'paymentId and reason are required'
      }, { status: 400 });
    }

    // Find payment record with booking details
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: authResult.user.id,
        status: { in: ['COMPLETED', 'REFUNDED'] }
      },
      include: {
        booking: true,
        refunds: true
      }
    });

    if (!payment) {
      return NextResponse.json({
        success: false,
        error: 'Original payment not found',
        details: 'Original payment not found',
        debug: {
          searchedPaymentId: paymentId,
          searchedUserId: authResult.user.id,
          searchedStatus: 'COMPLETED or REFUNDED'
        }
      }, { status: 404 });
    }

    // Check if booking is in cancellable status  
    if (['CANCELLED'].includes(payment.booking.status)) {
      // If booking is already cancelled, check if refund already exists
      const existingRefund = payment.refunds.find(refund => 
        ['PENDING', 'COMPLETED', 'PROCESSED'].includes(refund.status)
      );
      
      if (existingRefund) {
        return NextResponse.json({
          success: false,
          error: 'Refund already processed for this payment',
          details: {
            refundId: existingRefund.id,
            status: existingRefund.status,
            amount: existingRefund.amount,
            processedAt: existingRefund.processedAt
          }
        }, { status: 409 });
      }
    }

    if (!['CONFIRMED', 'PENDING', 'CANCELLED'].includes(payment.booking.status)) {
      return NextResponse.json({
        success: false,
        error: 'Booking is not eligible for refund',
        details: `Booking status is ${payment.booking.status}`
      }, { status: 400 });
    }

    // Check if refund already exists
    const existingRefund = payment.refunds.find(refund => 
      ['PENDING', 'COMPLETED'].includes(refund.status)
    );

    if (existingRefund) {
      return NextResponse.json({
        success: false,
        error: 'Refund already processed or pending for this payment'
      }, { status: 409 });
    }

    // Calculate refund amount based on policy
    const refundCalculation = PaymentService.calculateRefund(
      payment.booking, 
      payment.totalAmount
    );

    if (!refundCalculation.eligible) {
      return NextResponse.json({
        success: false,
        error: 'Booking is not eligible for refund',
        details: refundCalculation.reason
      }, { status: 400 });
    }

    // Process refund through payment gateway
    const refundResult = await PaymentService.processRefund({
      paymentId: payment.razorpayPaymentId,
      amount: refundCalculation.amount,
      reason: reason,
      notes: {
        bookingId: payment.bookingId,
        refundPercentage: refundCalculation.percentage,
        originalAmount: payment.totalAmount,
        ...notes
      }
    });

    if (!refundResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process refund',
        details: refundResult.error
      }, { status: 500 });
    }

    // Create refund record and update booking in transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create refund record
      const refund = await prisma.refund.create({
        data: {
          id: `refund_${Date.now()}_${payment.booking.id.slice(-4)}`,
          paymentId: payment.id,
          bookingId: payment.bookingId,
          userId: authResult.user.id,
          razorpayRefundId: refundResult.refund.id,
          amount: refundCalculation.amount,
          originalAmount: payment.totalAmount,
          refundPercentage: refundCalculation.percentage,
          status: 'PENDING',
          reason: reason,
          notes: notes || {},
          processedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update booking status to cancelled
      const updatedBooking = await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date()
        },
        include: {
          court: {
            include: {
              facility: true
            }
          }
        }
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date()
        }
      });

      return { refund, booking: updatedBooking };
    });

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refundId: result.refund.id,
        status: 'PENDING',
        amount: refundCalculation.amount,
        percentage: refundCalculation.percentage,
        originalAmount: payment.totalAmount,
        estimatedProcessingTime: '5-7 business days',
        razorpayRefundId: refundResult.refund.id,
        booking: {
          id: result.booking.id,
          status: 'CANCELLED',
          facilityName: result.booking.court.facility.name,
          courtName: result.booking.court.name,
          date: result.booking.bookingDate,
          time: `${result.booking.startTime} - ${result.booking.endTime}`,
          cancelledAt: result.booking.cancelledAt
        },
        refundPolicy: {
          percentage: refundCalculation.percentage,
          reason: refundCalculation.reason
        },
        actions: {
          checkStatus: `/api/payments/refund/${result.refund.id}/status`,
          viewBooking: `/api/bookings/${result.booking.id}`,
          downloadRefundReceipt: `/api/payments/refund/${result.refund.id}/receipt`
        }
      }
    };

    // TODO: Send refund confirmation email/SMS
    // await sendRefundInitiatedNotification({
    //   user: payment.booking.user,
    //   refund: result.refund,
    //   booking: result.booking
    // });

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/payments/refund/{refundId}/status
 * 
 * Get refund status
 */
export async function GET(request) {
  try {
    // Get refund ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const refundId = pathParts[pathParts.indexOf('refund') + 1];

    if (!refundId || refundId === 'status') {
      return NextResponse.json({
        success: false,
        error: 'Refund ID is required'
      }, { status: 400 });
    }

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Find refund record
    const refund = await prisma.refund.findFirst({
      where: {
        id: refundId,
        userId: authResult.user.id
      },
      include: {
        payment: true,
        booking: {
          include: {
            timeSlot: {
              include: {
                court: {
                  include: {
                    facility: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!refund) {
      return NextResponse.json({
        success: false,
        error: 'Refund not found'
      }, { status: 404 });
    }

    // Get fresh status from payment gateway if available
    let gatewayStatus = null;
    if (refund.razorpayRefundId) {
      try {
        // Note: Razorpay doesn't have a direct refund status API
        // Status is typically updated via webhooks
        gatewayStatus = {
          id: refund.razorpayRefundId,
          status: refund.status,
          amount: refund.amount
        };
      } catch (gatewayError) {
        console.error('Gateway refund status error:', gatewayError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
        originalAmount: refund.originalAmount,
        refundPercentage: refund.refundPercentage,
        reason: refund.reason,
        razorpayRefundId: refund.razorpayRefundId,
        createdAt: refund.createdAt,
        processedAt: refund.processedAt,
        estimatedProcessingTime: refund.status === 'PENDING' ? '5-7 business days' : null,
        gatewayStatus,
        booking: {
          id: refund.booking.id,
          facilityName: refund.booking.court.facility.name,
          courtName: refund.booking.court.name,
          date: refund.booking.bookingDate,
          time: `${refund.booking.timeSlot.startTime} - ${refund.booking.timeSlot.endTime}`,
          status: refund.booking.status,
          cancelledAt: refund.booking.cancelledAt
        },
        payment: {
          id: refund.payment.id,
          amount: refund.payment.amount,
          method: refund.payment.method,
          completedAt: refund.payment.completedAt
        }
      }
    });

  } catch (error) {
    console.error('Get refund status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}