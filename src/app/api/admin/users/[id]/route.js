/**
 * ADMIN USER ACTIONS API
 * ======================
 * 
 * GET    /api/admin/users/[id] - Get user details
 * PUT    /api/admin/users/[id] - Update user (ban, activate, modify)
 * DELETE /api/admin/users/[id] - Delete user account
 * 
 * Allows admins to manage individual users including:
 * - View detailed user information
 * - Ban/unban users
 * - Activate/deactivate accounts
 * - Force password reset
 * 
 * @module api/admin/users/[id]
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/admin";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMA
// ==========================================

const updateUserSchema = z.object({
  action: z.enum(['ban', 'unban', 'activate', 'deactivate', 'verify', 'unverify']),
  reason: z.string().max(500).optional(),
  notifyUser: z.boolean().default(true)
});

// ==========================================
// GET /api/admin/users/[id]
// ==========================================

/**
 * Get detailed user information
 * 
 * Returns comprehensive user data including:
 * - Profile information
 * - Booking history and stats
 * - Review activity
 * - Facilities owned (if facility owner)
 * - Account status and flags
 * 
 * @requires Admin Authentication
 */
export async function GET(request, { params }) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const { id } = await params;

    // Fetch user with complete details
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        avatar: true,
        bio: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        deactivatedAt: true,
        deactivationReason: true,
        
        // Booking stats
        bookings: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            court: {
              select: {
                name: true,
                sportType: true,
                facility: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        
        // Review stats
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            facility: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        
        // Facilities (for owners)
        facilities: {
          select: {
            id: true,
            name: true,
            status: true,
            city: true,
            createdAt: true,
            _count: {
              select: { courts: true }
            }
          }
        },
        
        // Counts
        _count: {
          select: {
            bookings: true,
            reviews: true,
            facilities: true,
            payments: true
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

    // Calculate additional stats
    const bookingStats = await prisma.booking.groupBy({
      by: ['status'],
      where: { userId: id },
      _count: { status: true }
    });

    const totalSpent = await prisma.payment.aggregate({
      where: { userId: id, status: 'COMPLETED' },
      _sum: { totalAmount: true }
    });

    // Format response
    const userDetails = {
      ...user,
      stats: {
        totalBookings: user._count.bookings,
        totalReviews: user._count.reviews,
        totalFacilities: user._count.facilities,
        totalPayments: user._count.payments,
        totalSpent: totalSpent._sum.totalAmount || 0,
        bookingsByStatus: bookingStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count.status;
          return acc;
        }, {})
      }
    };

    delete userDetails._count;

    return NextResponse.json({
      success: true,
      message: 'User details retrieved',
      data: { user: userDetails }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve user details' },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/admin/users/[id]
// ==========================================

/**
 * Update user status (ban, activate, etc.)
 * 
 * Actions:
 * - ban: Deactivate user account with reason
 * - unban: Reactivate banned user
 * - activate: Activate deactivated account
 * - deactivate: Soft delete account
 * - verify: Mark email as verified
 * - unverify: Mark email as unverified
 * 
 * @requires Admin Authentication
 */
export async function PUT(request, { params }) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, reason, notifyUser } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true, isVerified: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from modifying other admins
    if (user.role === 'ADMIN' && user.id !== admin.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot modify other admin accounts' },
        { status: 403 }
      );
    }

    // Apply action
    let updateData = {};
    let actionMessage = '';

    switch (action) {
      case 'ban':
      case 'deactivate':
        updateData = {
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: reason || `Account ${action}ned by admin`
        };
        actionMessage = `User has been ${action}ned`;
        break;

      case 'unban':
      case 'activate':
        updateData = {
          isActive: true,
          deactivatedAt: null,
          deactivationReason: null
        };
        actionMessage = `User has been ${action}d`;
        break;

      case 'verify':
        updateData = { isVerified: true };
        actionMessage = 'User email has been verified';
        break;

      case 'unverify':
        updateData = { isVerified: false };
        actionMessage = 'User email verification has been revoked';
        break;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        deactivatedAt: true,
        deactivationReason: true
      }
    });

    // TODO: Send notification email if notifyUser is true

    return NextResponse.json({
      success: true,
      message: actionMessage,
      data: {
        user: updatedUser,
        action,
        performedBy: admin.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE /api/admin/users/[id]
// ==========================================

/**
 * Delete user account (hard delete)
 * 
 * ⚠️ Permanently deletes user and all associated data
 * Use with caution - prefer deactivation for most cases
 * 
 * @requires Admin Authentication
 */
export async function DELETE(request, { params }) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    const { id } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        _count: {
          select: {
            bookings: true,
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

    // Prevent deleting admin accounts
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete admin accounts' },
        { status: 403 }
      );
    }

    // Warn if user has active facilities
    if (user._count.facilities > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User has active facilities. Transfer or delete them first.',
          data: { facilitiesCount: user._count.facilities }
        },
        { status: 400 }
      );
    }

    // Delete user (cascades to related records)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted permanently',
      data: {
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        deletedBy: admin.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
