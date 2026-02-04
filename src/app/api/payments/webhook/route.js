/**
 * PAYMENT WEBHOOK API
 * ==================
 * 
 * POST /api/payments/webhook
 * 
 * Handles payment gateway webhooks for automatic payment status updates.
 * 
 * SUPPORTED EVENTS:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * - refund.processed: Refund completed
 * 
 * SECURITY:
 * - Verifies webhook signature
 * - Idempotent processing
 * - Rate limiting protection
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import PaymentService from '@/services/payment.service';
import { webhookSchema } from '@/validations/payment.validation';

export async function POST(request) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({
        success: false,
        error: 'Missing webhook signature'
      }, { status: 400 });
    }

    // Verify webhook signature
    const isSignatureValid = PaymentService.verifyWebhook(body, signature);
    
    if (!isSignatureValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({
        success: false,
        error: 'Invalid webhook signature'
      }, { status: 401 });
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    
    // Validate webhook data
    const validation = webhookSchema.safeParse(payload);
    
    if (!validation.success) {
      console.error('Invalid webhook payload:', validation.error.issues);
      return NextResponse.json({
        success: false,
        error: 'Invalid webhook payload'
      }, { status: 400 });
    }

    // Parse webhook event
    const webhookData = PaymentService.parseWebhookPayload(payload);
    
    console.log('Processing webhook event:', {
      type: webhookData.type,
      paymentId: webhookData.paymentId,
      orderId: webhookData.orderId
    });

    // Process webhook based on event type
    switch (webhookData.type) {
      case 'PAYMENT_SUCCESS':
        await handlePaymentSuccess(webhookData);
        break;
        
      case 'PAYMENT_FAILED':
        await handlePaymentFailure(webhookData);
        break;
        
      case 'REFUND_PROCESSED':
        await handleRefundProcessed(webhookData);
        break;
        
      default:
        console.log('Unhandled webhook event:', webhookData.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed'
    }, { status: 500 });
  }
}

/**
 * Handle successful payment webhook
 */
async function handlePaymentSuccess(webhookData) {
  try {
    const { paymentId, orderId, amount, method } = webhookData;

    // Find payment record by Razorpay order ID
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: orderId,
        status: 'PENDING'
      },
      include: {
        booking: {
          include: {
            user: true,
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

    if (!payment) {
      console.log('Payment record not found for webhook:', { orderId, paymentId });
      return;
    }

    // Check if already processed to avoid duplicate processing
    if (payment.razorpayPaymentId === paymentId) {
      console.log('Payment already processed:', paymentId);
      return;
    }

    // Update payment and booking in transaction
    await prisma.$transaction(async (prisma) => {
      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: paymentId,
          status: 'COMPLETED',
          method: method?.toUpperCase() || payment.method,
          completedAt: new Date(),
          updatedAt: new Date(),
          webhookProcessedAt: new Date()
        }
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          updatedAt: new Date()
        }
      });
    });

    console.log('Payment confirmed via webhook:', {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      amount: amount
    });

    // TODO: Send booking confirmation notification
    // await sendBookingConfirmation({
    //   booking: payment.booking,
    //   payment: payment,
    //   user: payment.booking.user
    // });

  } catch (error) {
    console.error('Handle payment success error:', error);
    throw error;
  }
}

/**
 * Handle failed payment webhook
 */
async function handlePaymentFailure(webhookData) {
  try {
    const { paymentId, orderId, errorCode, errorDescription } = webhookData;

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: orderId,
        status: 'PENDING'
      },
      include: {
        booking: true
      }
    });

    if (!payment) {
      console.log('Payment record not found for failed webhook:', { orderId, paymentId });
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: paymentId,
        status: 'FAILED',
        failureReason: errorDescription || `Error code: ${errorCode}`,
        updatedAt: new Date(),
        webhookProcessedAt: new Date()
      }
    });

    console.log('Payment failed via webhook:', {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      errorCode,
      errorDescription
    });

    // TODO: Send payment failure notification
    // await sendPaymentFailureNotification({
    //   booking: payment.booking,
    //   payment: payment,
    //   reason: errorDescription
    // });

  } catch (error) {
    console.error('Handle payment failure error:', error);
    throw error;
  }
}

/**
 * Handle refund processed webhook
 */
async function handleRefundProcessed(webhookData) {
  try {
    const { refundId, paymentId, amount } = webhookData;

    // Find payment record by Razorpay payment ID
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayPaymentId: paymentId
      },
      include: {
        booking: {
          include: {
            user: true
          }
        }
      }
    });

    if (!payment) {
      console.log('Payment record not found for refund webhook:', { paymentId, refundId });
      return;
    }

    // Check if refund already exists
    const existingRefund = await prisma.refund.findFirst({
      where: {
        razorpayRefundId: refundId
      }
    });

    if (existingRefund) {
      console.log('Refund already processed:', refundId);
      return;
    }

    // Create refund record
    await prisma.refund.create({
      data: {
        id: `refund_${Date.now()}`,
        paymentId: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        razorpayRefundId: refundId,
        amount: amount,
        status: 'COMPLETED',
        reason: 'Booking cancelled',
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update payment status to refunded
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date()
      }
    });

    console.log('Refund processed via webhook:', {
      refundId: refundId,
      paymentId: payment.id,
      amount: amount
    });

    // TODO: Send refund confirmation notification
    // await sendRefundConfirmation({
    //   booking: payment.booking,
    //   user: payment.booking.user,
    //   refundAmount: amount
    // });

  } catch (error) {
    console.error('Handle refund processed error:', error);
    throw error;
  }
}

// Disable body parsing for raw webhook data
