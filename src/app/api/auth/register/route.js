/**
 * User Registration API Route
 * POST /api/auth/register
 */

import { AuthService } from '../../../../services/auth.service.js';
import { mailService } from '../../../../lib/mail.js';
import { authValidation, validateRequest } from '../../../../validations/auth.validation.js';
import { createResponse, createErrorResponse } from '../../../../lib/auth.js';

const authService = new AuthService();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate and sanitize request body
    const validation = validateRequest(body, authValidation.register);
    if (!validation.isValid) {
      return createErrorResponse(
        'Validation failed', 
        400, 
        validation.errors
      );
    }

    // Register user with sanitized data
    const user = await authService.registerUser(validation.data);
    
    // Generate OTP for email verification
    const otpResult = await authService.generateOtp(
      user.email, 
      'EMAIL_VERIFICATION'
    );
    
    // Send OTP via email (in development, we'll return it in response)
    if (process.env.NODE_ENV === 'production') {
      await mailService.sendOtpEmail(
        user.email, 
        otpResult.otpCode, 
        user.name
      );
    }
    
    return createResponse(
      {
        user,
        otpExpiry: otpResult.expiresAt,
        // Only include OTP in development
        ...(process.env.NODE_ENV === 'development' && { otpCode: otpResult.otpCode })
      },
      'User registered successfully. Please verify your email.',
      201
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    
    return createErrorResponse(
      error.message || 'Registration failed',
      400
    );
  }
}