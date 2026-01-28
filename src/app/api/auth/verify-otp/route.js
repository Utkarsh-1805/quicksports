/**
 * OTP Verification API Route
 * POST /api/auth/verify-otp
 */

import { AuthService } from '../../../../services/auth.service.js';
import { authValidation, validateRequest } from '../../../../validations/auth.validation.js';
import { createResponse, createErrorResponse } from '../../../../lib/auth.js';

const authService = new AuthService();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate and sanitize request body
    const validation = validateRequest(body, authValidation.verifyOtp);
    if (!validation.isValid) {
      return createErrorResponse(
        'Validation failed', 
        400, 
        validation.errors
      );
    }

    // Verify OTP with sanitized data
    const result = await authService.verifyOtp(
      validation.data.email,
      validation.data.code,
      body.type || 'EMAIL_VERIFICATION'
    );
    
    return createResponse(
      result,
      'OTP verified successfully'
    );
    
  } catch (error) {
    console.error('OTP verification error:', error);
    
    return createErrorResponse(
      error.message || 'OTP verification failed',
      400
    );
  }
}