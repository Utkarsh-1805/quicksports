/**
 * Payment Methods API
 * GET /api/payments/methods - Get available payment methods
 */

import { NextResponse } from "next/server";
import PaymentService from "../../../services/payment.service";

/**
 * GET - Get available payment methods with fees
 */
export async function GET(request) {
  try {
    const methods = PaymentService.getPaymentMethods();
    
    // Get Razorpay key for frontend
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    
    if (!razorpayKeyId) {
      return NextResponse.json({
        success: false,
        message: 'Payment gateway not configured'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      data: {
        gateway: 'razorpay',
        keyId: razorpayKeyId,
        currency: 'INR',
        methods,
        config: {
          minAmount: 1, // ₹1 minimum
          maxAmount: 500000, // ₹5,00,000 maximum
          currency: 'INR',
          theme: {
            color: '#3B82F6' // Primary brand color
          },
          retry: {
            enabled: true,
            maxCount: 3
          },
          timeout: 300 // 5 minutes
        }
      }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load payment methods' },
      { status: 500 }
    );
  }
}
