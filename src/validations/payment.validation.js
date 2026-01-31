/**
 * PAYMENT VALIDATION SCHEMAS
 * ==========================
 * 
 * Validation for payment processing, webhooks, and refunds.
 * 
 * PAYMENT FLOW:
 * 1. Create payment order → createPaymentSchema
 * 2. Process payment → processPaymentSchema  
 * 3. Handle webhooks → webhookSchema
 * 4. Process refunds → refundSchema
 */

import { z } from 'zod';

// Valid payment statuses
export const PAYMENT_STATUSES = [
  'PENDING',    // Payment initiated but not completed
  'COMPLETED',  // Payment successful
  'FAILED',     // Payment failed/declined
  'REFUNDED',   // Payment refunded
  'CANCELLED'   // Payment cancelled
];

// Valid payment methods
export const PAYMENT_METHODS = [
  'CARD',           // Credit/Debit Card
  'UPI',           // UPI payments
  'NET_BANKING',   // Net Banking
  'WALLET',        // Digital wallets
  'EMI'            // EMI options
];

// Valid refund reasons
export const REFUND_REASONS = [
  'USER_CANCELLED',      // User cancelled booking
  'FACILITY_UNAVAILABLE', // Facility/court unavailable
  'TECHNICAL_ISSUE',     // Technical problems
  'ADMIN_CANCELLED',     // Admin cancelled
  'DUPLICATE_PAYMENT',   // Duplicate payment made
  'OTHER'               // Other reasons
];

/**
 * CREATE PAYMENT ORDER SCHEMA
 * 
 * Used when initiating payment for a booking.
 * Creates payment order with gateway (Razorpay, etc.)
 */
export const createPaymentSchema = z.object({
  paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'EMI']),
  currency: z.enum(['INR', 'USD']).default('INR'),
  notes: z.record(z.any()).optional() // Accept object for notes/metadata
});

/**
 * PROCESS PAYMENT SCHEMA
 * 
 * Used when user completes payment on frontend.
 * Contains payment gateway response data.
 */
export const processPaymentSchema = z.object({
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'), // For verification
  method: z.enum(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'EMI']).optional(),
  
  // Gateway specific data
  gatewayData: z.object({
    razorpay_payment_id: z.string().optional(),
    razorpay_order_id: z.string().optional(),
    razorpay_signature: z.string().optional(),
    // Add other gateway fields as needed
  }).optional()
});

/**
 * WEBHOOK VALIDATION SCHEMA
 * 
 * Used for payment gateway webhooks.
 * Validates incoming webhook data from payment providers.
 */
export const webhookSchema = z.object({
  event: z.string().min(1, 'Event type is required'),
  payload: z.object({
    payment: z.object({
      id: z.string(),
      order_id: z.string().optional(),
      status: z.string(),
      amount: z.number(),
      currency: z.string(),
      method: z.string().optional()
    }).optional(),
    order: z.object({
      id: z.string(),
      status: z.string(),
      amount: z.number()
    }).optional()
  }),
  
  // Webhook verification
  signature: z.string().optional(),
  timestamp: z.number().optional()
});

/**
 * REFUND REQUEST SCHEMA
 * 
 * Used when processing refunds for cancelled bookings.
 */
export const refundSchema = z.object({
  reason: z.enum(REFUND_REASONS),
  amount: z.number().positive('Refund amount must be positive').optional(),
  notes: z.string().max(500).optional(),
  
  // Admin only fields
  adminApproval: z.boolean().default(false),
  adminNotes: z.string().max(1000).optional()
});

/**
 * PAYMENT QUERY SCHEMA
 * 
 * For filtering payment history and reports.
 */
export const paymentQuerySchema = z.object({
  status: z.enum(PAYMENT_STATUSES).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
}).refine((data) => {
  // Validate date range
  if (data.fromDate && data.toDate) {
    return new Date(data.fromDate) <= new Date(data.toDate);
  }
  return true;
}, {
  message: 'fromDate must be before or equal to toDate',
  path: ['fromDate']
}).refine((data) => {
  // Validate amount range
  if (data.minAmount && data.maxAmount) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: 'minAmount must be less than or equal to maxAmount',
  path: ['minAmount']
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate processing fees
 * 
 * @param {number} amount - Base amount
 * @param {string} method - Payment method
 * @returns {object} Fee breakdown
 */
export function calculateProcessingFees(amount, method = 'CARD') {
  const feeRates = {
    CARD: 0.0299,        // 2.99% for cards
    UPI: 0.005,          // 0.5% for UPI
    NET_BANKING: 0.019,  // 1.9% for net banking
    WALLET: 0.015,       // 1.5% for wallets
    EMI: 0.035           // 3.5% for EMI
  };
  
  const rate = feeRates[method] || feeRates.CARD;
  const fee = Math.round(amount * rate * 100) / 100; // Round to 2 decimals
  const gst = Math.round(fee * 0.18 * 100) / 100;   // 18% GST on processing fee
  
  return {
    baseAmount: amount,
    processingFee: fee,
    gst: gst,
    totalFee: fee + gst,
    totalAmount: amount + fee + gst
  };
}

/**
 * Generate unique order ID
 * 
 * @param {string} bookingId - Booking ID
 * @returns {string} Unique order ID
 */
export function generateOrderId(bookingId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `ORDER_${bookingId.slice(-8)}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Verify payment signature (Razorpay example)
 * 
 * @param {string} orderId - Order ID
 * @param {string} paymentId - Payment ID  
 * @param {string} signature - Received signature
 * @param {string} secret - Webhook secret
 * @returns {boolean} Is signature valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  const crypto = require('crypto');
  
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
    
  return expectedSignature === signature;
}

/**
 * Format currency for display
 * 
 * @param {number} amount - Amount in smallest unit (paise for INR)
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export function formatCurrency(amount, currency = 'INR') {
  const formatters = {
    INR: new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0
    }),
    USD: new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    })
  };
  
  const formatter = formatters[currency] || formatters.INR;
  
  // Convert from smallest unit to main unit
  const mainAmount = currency === 'INR' ? amount / 100 : amount / 100;
  
  return formatter.format(mainAmount);
}

/**
 * Get refund eligibility based on booking timing
 * 
 * @param {Date} bookingDate - Booking date
 * @param {string} startTime - Booking start time
 * @returns {object} Refund eligibility details
 */
export function getRefundEligibility(bookingDate, startTime) {
  const now = new Date();
  const bookingDateTime = new Date(`${bookingDate.toISOString().split('T')[0]}T${startTime}:00`);
  
  const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking < 0) {
    return {
      eligible: false,
      percentage: 0,
      reason: 'Booking has already started or passed'
    };
  }
  
  if (hoursUntilBooking >= 24) {
    return {
      eligible: true,
      percentage: 100,
      reason: 'Full refund - cancelled 24+ hours before booking'
    };
  }
  
  if (hoursUntilBooking >= 12) {
    return {
      eligible: true,
      percentage: 50,
      reason: 'Partial refund - cancelled 12-24 hours before booking'
    };
  }
  
  return {
    eligible: true,
    percentage: 0,
    reason: 'No refund - cancelled less than 12 hours before booking'
  };
}