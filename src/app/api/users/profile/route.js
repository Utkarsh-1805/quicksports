/**
 * USER PROFILE API
 * =================
 * 
 * GET  /api/users/profile - Get current user's profile
 * PUT  /api/users/profile - Update current user's profile
 * 
 * All endpoints require authentication.
 * 
 * @module api/users/profile
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyAuth } from "../../../../lib/auth";
import { 
  updateProfileSchema, 
  validateUserRequest 
} from "../../../../validations/user.validation";

// ==========================================
// GET /api/users/profile
// ==========================================

/**
 * Get current user's profile
 * 
 * Returns complete user profile including:
 * - Basic info (name, email, phone)
 * - Profile settings (avatar, bio, preferences)
 * - Account stats (bookings count, reviews count)
 * 
 * @requires Authentication
 * 
 * @example
 * GET /api/users/profile
 * Headers: { Authorization: "Bearer <token>" }
 * 
 * @returns {Object} User profile with stats
 */
export async function GET(request) {
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
    // STEP 2: Fetch User Profile with Stats
    // ==========================================
    /**
     * LOGIC:
     * - Get complete user data excluding password
     * - Include counts for bookings, reviews, facilities
     * - Calculate member duration
     */
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        avatar: true,
        bio: true,
        preferences: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        
        // Include counts for stats
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

    // Check if account is deactivated
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 3: Format Response
    // ==========================================
    /**
     * LOGIC:
     * - Calculate membership duration in days
     * - Parse preferences JSON if exists
     * - Include quick stats summary
     */
    const memberSinceDays = Math.floor(
      (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
    );

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
      bio: user.bio,
      preferences: user.preferences || {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        reminderHours: 24,
        theme: 'system',
        language: 'en'
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      
      // Stats summary
      stats: {
        totalBookings: user._count.bookings,
        totalReviews: user._count.reviews,
        totalFacilities: user._count.facilities, // For facility owners
        memberSinceDays
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { profile }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/users/profile
// ==========================================

/**
 * Update current user's profile
 * 
 * Supports partial updates for:
 * - name: Display name (2-50 chars)
 * - phone: Phone number (optional)
 * - avatar: Profile picture URL
 * - bio: Short bio (max 500 chars)
 * - preferences: Notification & display settings
 * 
 * @requires Authentication
 * 
 * @example
 * PUT /api/users/profile
 * Body: { "name": "John Doe", "phone": "+91-9876543210" }
 * 
 * @returns {Object} Updated user profile
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

    const validation = validateUserRequest(body, updateProfileSchema);
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

    const { name, phone, avatar, bio, preferences } = validation.data;

    // ==========================================
    // STEP 3: Check User Exists and is Active
    // ==========================================
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, preferences: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!existingUser.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 4: Build Update Data
    // ==========================================
    /**
     * LOGIC:
     * - Only include fields that were provided
     * - Merge preferences with existing (don't overwrite entire object)
     * - Set updatedAt automatically
     */
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (bio !== undefined) updateData.bio = bio || null;
    
    // Merge preferences with existing
    if (preferences !== undefined) {
      const currentPrefs = existingUser.preferences || {};
      updateData.preferences = {
        ...currentPrefs,
        ...preferences
      };
    }

    // ==========================================
    // STEP 5: Update User Profile
    // ==========================================
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        avatar: true,
        bio: true,
        preferences: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
