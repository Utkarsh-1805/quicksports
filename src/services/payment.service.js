/**
 * PAYMENT SERVICE
 * ===============
 * 
 * Handles all payment gateway integrations and processing.
 * 
 * FEATURES:
 * - Razorpay integration
 * - Order creation
 * - Payment verification
 * - Refund processing
 * - Webhook handling
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
  generateOrderId,
  calculateProcessingFees,
  verifyPaymentSignature,
  getRefundEligibility
} from '@/validations/payment.validation';

class PaymentService {
  constructor() {
    // Initialize Razorpay instance
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  }

  /**
   * Create payment order
   * 
   * @param {object} params - Order parameters
   * @param {string} params.bookingId - Booking ID
   * @param {number} params.amount - Amount in rupees
   * @param {string} params.currency - Currency (default: INR)
   * @param {object} params.notes - Additional notes
   * @param {boolean} params.skipFeeCalculation - Skip adding fees if already included
   * @returns {object} Payment order details
   */
  async createOrder({ bookingId, amount, currency = 'INR', notes = {}, skipFeeCalculation = false }) {
    try {
      // Calculate fees only if not skipped
      let feeBreakdown;
      let finalAmount;
      
      if (skipFeeCalculation) {
        // Fees already included in amount - pass through directly
        finalAmount = amount;
        feeBreakdown = {
          baseAmount: amount,
          processingFee: 0,
          gst: 0,
          totalFee: 0,
          totalAmount: amount
        };
      } else {
        feeBreakdown = calculateProcessingFees(amount);
        finalAmount = feeBreakdown.totalAmount;
      }

      // Generate unique order ID
      const orderId = generateOrderId(bookingId);

      // Create order with Razorpay
      const orderOptions = {
        amount: Math.round(finalAmount * 100), // Convert to paise
        currency: currency,
        receipt: orderId,
        notes: {
          bookingId,
          originalAmount: amount,
          processingFee: feeBreakdown.processingFee,
          gst: feeBreakdown.gst,
          ...notes
        }
      };

      const order = await this.razorpay.orders.create(orderOptions);

      return {
        success: true,
        order: {
          id: order.id,
          orderId: orderId,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          feeBreakdown,
          razorpayOrderId: order.id
        }
      };

    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment signature
   * 
   * @param {object} params - Verification parameters
   * @param {string} params.orderId - Razorpay order ID
   * @param {string} params.paymentId - Razorpay payment ID
   * @param {string} params.signature - Razorpay signature
   * @returns {boolean} Is payment verified
   */
  verifyPayment({ orderId, paymentId, signature }) {
    try {
      const body = orderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpay.key_secret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Get payment details
   * 
   * @param {string} paymentId - Razorpay payment ID
   * @returns {object} Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      // Check if this is a development/test payment ID
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment && (paymentId.startsWith('ORDER_') || paymentId.startsWith('pay_test'))) {
        // Mock payment details for development testing
        return {
          success: true,
          payment: {
            id: paymentId,
            orderId: `order_${Date.now()}`,
            status: 'captured',
            method: 'card',
            amount: 414.11, // Mock amount
            currency: 'INR',
            captured: true,
            createdAt: new Date(),
            notes: {}
          }
        };
      }

      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        success: true,
        payment: {
          id: payment.id,
          orderId: payment.order_id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount / 100, // Convert from paise
          currency: payment.currency,
          captured: payment.captured,
          createdAt: new Date(payment.created_at * 1000),
          notes: payment.notes
        }
      };
    } catch (error) {
      console.error('Get payment details error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process refund
   * 
   * @param {object} params - Refund parameters
   * @param {string} params.paymentId - Original payment ID
   * @param {number} params.amount - Refund amount (optional, full refund if not provided)
   * @param {string} params.reason - Refund reason
   * @param {object} params.notes - Additional notes
   * @returns {object} Refund details
   */
  async processRefund({ paymentId, amount, reason, notes = {} }) {
    try {
      // Get original payment details
      const paymentDetails = await this.getPaymentDetails(paymentId);

      if (!paymentDetails.success) {
        return {
          success: false,
          error: 'Original payment not found'
        };
      }

      const refundAmount = amount || paymentDetails.payment.amount;

      // Check if this is development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      let refund;

      if (isDevelopment && (paymentId.startsWith('ORDER_') || paymentId.startsWith('pay_test'))) {
        // Mock refund for development testing
        refund = {
          id: `rfnd_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          payment_id: paymentId,
          amount: Math.round(refundAmount * 100),
          currency: 'INR',
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000),
          notes: {
            reason,
            originalAmount: paymentDetails.payment.amount,
            refundAmount,
            ...notes
          }
        };
      } else {
        // Create refund through Razorpay
        const refundOptions = {
          amount: Math.round(refundAmount * 100), // Convert to paise
          notes: {
            reason,
            originalAmount: paymentDetails.payment.amount,
            refundAmount,
            ...notes
          }
        };

        refund = await this.razorpay.payments.refund(paymentId, refundOptions);
      }

      return {
        success: true,
        refund: {
          id: refund.id,
          paymentId: refund.payment_id,
          amount: refund.amount / 100, // Convert from paise
          currency: refund.currency,
          status: refund.status,
          createdAt: new Date(refund.created_at * 1000),
          notes: refund.notes
        }
      };

    } catch (error) {
      console.error('Process refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature
   * 
   * @param {string} body - Webhook body
   * @param {string} signature - Webhook signature
   * @returns {boolean} Is webhook verified
   */
  verifyWebhook(body, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Parse webhook payload
   * 
   * @param {object} payload - Webhook payload
   * @returns {object} Parsed webhook data
   */
  parseWebhookPayload(payload) {
    const { event, payload: data } = payload;

    switch (event) {
      case 'payment.captured':
        return {
          type: 'PAYMENT_SUCCESS',
          paymentId: data.payment.entity.id,
          orderId: data.payment.entity.order_id,
          amount: data.payment.entity.amount / 100,
          method: data.payment.entity.method,
          status: 'COMPLETED'
        };

      case 'payment.failed':
        return {
          type: 'PAYMENT_FAILED',
          paymentId: data.payment.entity.id,
          orderId: data.payment.entity.order_id,
          amount: data.payment.entity.amount / 100,
          status: 'FAILED',
          errorCode: data.payment.entity.error_code,
          errorDescription: data.payment.entity.error_description
        };

      case 'refund.processed':
        return {
          type: 'REFUND_PROCESSED',
          refundId: data.refund.entity.id,
          paymentId: data.refund.entity.payment_id,
          amount: data.refund.entity.amount / 100,
          status: 'REFUNDED'
        };

      default:
        return {
          type: 'UNKNOWN',
          event,
          data
        };
    }
  }

  /**
   * Get payment methods for frontend
   * 
   * @returns {object} Available payment methods
   */
  getPaymentMethods() {
    return {
      card: {
        name: 'Credit/Debit Card',
        enabled: true,
        fee: '2.99%'
      },
      upi: {
        name: 'UPI',
        enabled: true,
        fee: '0.5%'
      },
      netbanking: {
        name: 'Net Banking',
        enabled: true,
        fee: '1.9%'
      },
      wallet: {
        name: 'Wallets',
        enabled: true,
        fee: '1.5%'
      },
      emi: {
        name: 'EMI',
        enabled: true,
        fee: '3.5%'
      }
    };
  }

  /**
   * Calculate refund amount based on policy
   * 
   * @param {object} booking - Booking details
   * @param {number} paidAmount - Amount paid
   * @returns {object} Refund calculation
   */
  calculateRefund(booking, paidAmount) {
    const eligibility = getRefundEligibility(booking.bookingDate, booking.startTime);

    const refundAmount = (paidAmount * eligibility.percentage) / 100;

    return {
      eligible: eligibility.eligible,
      percentage: eligibility.percentage,
      amount: Math.round(refundAmount * 100) / 100, // Round to 2 decimals
      reason: eligibility.reason,
      originalAmount: paidAmount
    };
  }
}

// Export singleton instance
const paymentServiceInstance = new PaymentService();
export default paymentServiceInstance;