/**
 * APPLY COUPON API
 * ================
 * 
 * POST /api/coupons/apply - Validate and calculate discount for a booking
 */

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAuth } from '../../../../lib/auth';

/**
 * POST /api/coupons/apply - Apply coupon to calculate discount
 * Body: { code, bookingAmount, sportType }
 */
export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    const body = await request.json();
    const { code, bookingAmount, sportType } = body;

    if (!code || !bookingAmount) {
      return NextResponse.json(
        { success: false, error: 'Coupon code and booking amount are required' },
        { status: 400 }
      );
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Validate coupon
    const now = new Date();

    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'This coupon is no longer active' },
        { status: 400 }
      );
    }

    if (coupon.validFrom > now) {
      return NextResponse.json(
        { success: false, error: 'This coupon is not yet active' },
        { status: 400 }
      );
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json(
        { success: false, error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check minimum booking value
    if (coupon.minBookingValue && bookingAmount < coupon.minBookingValue) {
      return NextResponse.json(
        { success: false, error: `Minimum booking amount for this coupon is ₹${coupon.minBookingValue}` },
        { status: 400 }
      );
    }

    // Check sport type restriction
    if (coupon.sportTypes.length > 0 && sportType) {
      if (!coupon.sportTypes.includes(sportType)) {
        return NextResponse.json(
          { success: false, error: `This coupon is not valid for ${sportType}` },
          { status: 400 }
        );
      }
    }

    // Check user usage limit
    const userUsage = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        userId: userId
      }
    });

    if (userUsage >= coupon.perUserLimit) {
      return NextResponse.json(
        { success: false, error: 'You have already used this coupon the maximum number of times' },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (bookingAmount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    // Apply max discount cap
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // Don't exceed booking amount
    if (discount > bookingAmount) {
      discount = bookingAmount;
    }

    const finalAmount = bookingAmount - discount;

    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        originalAmount: bookingAmount,
        discount: Math.round(discount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100
      }
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply coupon' },
      { status: 500 }
    );
  }
}
