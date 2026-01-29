/**
 * Admin Authentication Middleware
 * Validates that user has ADMIN role for admin-only operations
 */

import { verifyAuthToken } from './auth.js';

/**
 * Middleware to verify admin access
 * @param {Request} request 
 * @returns {Object} - { success, user, error }
 */
export async function requireAdmin(request) {
  try {
    // First verify the token
    const authResult = await verifyAuthToken(request);
    
    if (authResult.error || !authResult.user) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401
      };
    }

    const user = authResult.user;

    // Check if user has admin role
    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
        status: 403
      };
    }

    return {
      success: true,
      user: user
    };

  } catch (error) {
    console.error('Admin auth error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 401
    };
  }
}

/**
 * Check if user is admin (utility function)
 * @param {Object} user 
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user && user.role === 'ADMIN';
}

/**
 * Check if user can manage venues (admin or facility owner)
 * @param {Object} user 
 * @param {string} facilityOwnerId 
 * @returns {boolean}
 */
export function canManageVenue(user, facilityOwnerId) {
  return user.role === 'ADMIN' || user.id === facilityOwnerId;
}