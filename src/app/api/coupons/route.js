/**
 * COUPONS API
 * ===========
 * 
 * GET  /api/coupons         - Get active coupons (user) or all coupons (admin)
 * POST /api/coupons         - Create coupon (admin only)
 * POST /api/coupons/apply   - Apply coupon to booking
 */

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

/**
 * GET /api/coupons - Get coupons
 * Admin: Gets all coupons with usage stats
 * User: Gets active public coupons
 */
export async function GET(request) {
  try {
    // Optionally authenticate user
    const authResult = await verifyAuth(request);
    const decoded = authResult.success ? authResult.user : null;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // If checking specific code validity
    if (code) {
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
      if (coupon.validUntil && coupon.validUntil < now) {
        return NextResponse.json(
          { success: false, error: 'This coupon has expired' },
          { status: 400 }
        );
      }
      if (coupon.validFrom > now) {
        return NextResponse.json(
          { success: false, error: 'This coupon is not yet active' },
          { status: 400 }
        );
      }
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json(
          { success: false, error: 'This coupon has reached its usage limit' },
          { status: 400 }
        );
      }

      // Check user usage if authenticated
      if (decoded) {
        const userUsage = await prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            userId: decoded.id
          }
        });

        if (userUsage >= coupon.perUserLimit) {
          return NextResponse.json(
            { success: false, error: 'You have already used this coupon' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minBookingValue: coupon.minBookingValue,
            maxDiscount: coupon.maxDiscount,
            validUntil: coupon.validUntil,
            sportTypes: coupon.sportTypes
          }
        }
      });
    }

    // Admin: Get all coupons
    if (decoded?.role === 'ADMIN') {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { usages: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: { coupons }
      });
    }

    // User: Get active public coupons
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } }
        ],
        OR: [
          { usageLimit: null },
          { usageCount: { lt: prisma.coupon.fields.usageLimit } }
        ]
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minBookingValue: true,
        maxDiscount: true,
        validUntil: true,
        sportTypes: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: { coupons }
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons - Create coupon (admin only)
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

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType = 'PERCENTAGE',
      discountValue,
      minBookingValue,
      maxDiscount,
      usageLimit,
      perUserLimit = 1,
      validFrom,
      validUntil,
      sportTypes = []
    } = body;

    // Validation
    if (!code || !discountValue) {
      return NextResponse.json(
        { success: false, error: 'Code and discount value are required' },
        { status: 400 }
      );
    }

    if (discountType === 'PERCENTAGE' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Check if code exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minBookingValue,
        maxDiscount,
        usageLimit,
        perUserLimit,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        sportTypes,
        createdBy: authResult.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      data: { coupon }
    }, { status: 201 });

  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
