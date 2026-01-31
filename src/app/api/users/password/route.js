/**
 * PASSWORD MANAGEMENT API
 * =======================
 * 
 * PUT /api/users/password - Change user's password
 * 
 * Security features:
 * - Requires current password verification
 * - Password strength validation
 * - Prevents reuse of current password
 * 
 * @module api/users/password
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { verifyAuth } from "../../../../lib/auth";
import { 
  changePasswordSchema, 
  validateUserRequest 
} from "../../../../validations/user.validation";

// ==========================================
// PUT /api/users/password
// ==========================================

/**
 * Change user's password
 * 
 * Required fields:
 * - currentPassword: Current password for verification
 * - newPassword: New password (min 8 chars, uppercase, lowercase, number)
 * - confirmPassword: Must match newPassword
 * 
 * @requires Authentication
 * 
 * @example
 * PUT /api/users/password
 * Body: {
 *   "currentPassword": "OldPass123",
 *   "newPassword": "NewPass456",
 *   "confirmPassword": "NewPass456"
 * }
 * 
 * @returns {Object} Success message
 */
export async function PUT(request) {
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

    const validation = validateUserRequest(body, changePasswordSchema);
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

    const { currentPassword, newPassword } = validation.data;

    // ==========================================
    // STEP 3: Fetch User with Password
    // ==========================================
    /**
     * SECURITY:
     * - We need the hashed password to verify current password
     * - Also check if account is active
     */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        password: true, 
        isActive: true,
        email: true 
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
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 4: Verify Current Password
    // ==========================================
    /**
     * SECURITY:
     * - Compare provided password with stored hash
     * - Use bcrypt.compare for timing-safe comparison
     */
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // ==========================================
    // STEP 5: Hash New Password
    // ==========================================
    /**
     * SECURITY:
     * - Use bcrypt with salt rounds of 12
     * - Higher rounds = more secure but slower
     */
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // ==========================================
    // STEP 6: Update Password in Database
    // ==========================================
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // ==========================================
    // STEP 7: Return Success Response
    // ==========================================
    /**
     * NOTE: 
     * - In production, you might want to:
     *   1. Invalidate all existing sessions/tokens
     *   2. Send email notification about password change
     *   3. Log this security event
     */
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        email: user.email,
        changedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
