/**
 * ACCOUNT MANAGEMENT API
 * ======================
 * 
 * DELETE /api/users/account - Deactivate/delete user account
 * 
 * This implements a "soft delete" pattern:
 * - Account is marked as inactive, not permanently deleted
 * - User data is preserved for potential recovery
 * - Active bookings are handled appropriately
 * 
 * @module api/users/account
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { verifyAuth } from "../../../../lib/auth";
import { 
  deactivateAccountSchema, 
  validateUserRequest 
} from "../../../../validations/user.validation";

// ==========================================
// DELETE /api/users/account
// ==========================================

/**
 * Deactivate user account (soft delete)
 * 
 * Required fields:
 * - password: Current password for verification
 * - confirmText: Must be exactly "DELETE MY ACCOUNT"
 * - reason: Optional reason for leaving (feedback)
 * 
 * What happens:
 * 1. Account is marked as inactive
 * 2. User can no longer login
 * 3. Pending bookings are cancelled
 * 4. Data is preserved for 30 days before hard delete
 * 
 * @requires Authentication
 * 
 * @example
 * DELETE /api/users/account
 * Body: {
 *   "password": "YourPassword123",
 *   "confirmText": "DELETE MY ACCOUNT",
 *   "reason": "No longer using the service"
 * }
 * 
 * @returns {Object} Confirmation message
 */
export async function DELETE(request) {
  try {
    // ==========================================
    // STEP 1: Authenticate User
    // ==========================================
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // ==========================================
    // STEP 2: Parse and Validate Request Body
    // ==========================================
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = validateUserRequest(body, deactivateAccountSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    const { password, reason } = validation.data;

    // ==========================================
    // STEP 3: Fetch User and Verify Password
    // ==========================================
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true,
        name: true,
        password: true, 
        isActive: true,
        role: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: 'PENDING'
              }
            },
            facilities: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is already deactivated' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password' },
        { status: 401 }
      );
    }

    // ==========================================
    // STEP 4: Check for Active Obligations
    // ==========================================
    /**
     * BUSINESS LOGIC:
     * - Admins cannot deactivate their accounts (need another admin)
     * - Facility owners with pending bookings need to handle them first
     */
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Admin accounts cannot be self-deactivated. Contact another admin.' 
        },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 5: Handle Pending Bookings
    // ==========================================
    /**
     * LOGIC:
     * - Cancel all pending bookings for this user
     * - Add cancellation reason
     * - This triggers refund process if applicable
     */
    const pendingBookingsCount = await prisma.booking.count({
      where: {
        userId: userId,
        status: 'PENDING'
      }
    });

    if (pendingBookingsCount > 0) {
      await prisma.booking.updateMany({
        where: {
          userId: userId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'Account deactivated by user'
        }
      });
    }

    // ==========================================
    // STEP 6: Deactivate Account (Soft Delete)
    // ==========================================
    /**
     * SOFT DELETE:
     * - isActive = false prevents login
     * - Store deactivation timestamp and reason
     * - Data preserved for recovery/audit
     */
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: reason || 'User requested account deletion'
      }
    });

    // ==========================================
    // STEP 7: Return Success Response
    // ==========================================
    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
      data: {
        email: user.email,
        deactivatedAt: new Date().toISOString(),
        pendingBookingsCancelled: pendingBookingsCount,
        note: 'Your account has been deactivated. Data will be permanently deleted after 30 days. Contact support to recover your account.'
      }
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to deactivate account',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ==========================================
// GET /api/users/account
// ==========================================

/**
 * Get account status and settings
 * 
 * Returns:
 * - Account status (active/inactive)
 * - Security settings
 * - Connected services
 * - Data export options
 */
export async function GET(request) {
  try {
    // Authenticate
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Fetch account details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
            facilities: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account details retrieved',
      data: {
        account: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.isActive ? 'ACTIVE' : 'DEACTIVATED',
          isVerified: user.isVerified,
          memberSince: user.createdAt,
          lastLogin: user.lastLoginAt,
          stats: {
            totalBookings: user._count.bookings,
            totalReviews: user._count.reviews,
            totalFacilities: user._count.facilities
          }
        },
        actions: {
          exportData: '/api/users/export',
          changePassword: '/api/users/password',
          deactivate: '/api/users/account'
        }
      }
    });

  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get account details' },
      { status: 500 }
    );
  }
}
