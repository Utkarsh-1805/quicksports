/**
 * User Profile API Route
 * GET /api/auth/me
 */

import { AuthService } from '../../../../services/auth.service.js';
import { verifyAuthToken, createResponse, createErrorResponse } from '../../../../lib/auth.js';

const authService = new AuthService();

export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return createErrorResponse(
        authResult.error,
        401
      );
    }

    // Get fresh user data
    const user = await authService.getUserById(authResult.user.id);
    
    return createResponse(
      { user },
      'User profile retrieved successfully'
    );
    
  } catch (error) {
    console.error('Profile error:', error);
    
    return createErrorResponse(
      error.message || 'Failed to get user profile',
      400
    );
  }
}