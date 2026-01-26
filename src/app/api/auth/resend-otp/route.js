/**
 * Resend OTP API Route
 * POST /api/auth/resend-otp
 */

import { AuthService } from '../../../../services/auth.service.js';
import { mailService } from '../../../../lib/mail.js';
import { authValidation, validateRequest } from '../../../../validations/auth.validation.js';
import { createResponse, createErrorResponse } from '../../../../lib/auth.js';
import { prisma } from '../../../../lib/prisma.js';

const authService = new AuthService();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = validateRequest(body, authValidation.resendOtp);
    if (!validation.isValid) {
      return createErrorResponse(
        'Validation failed', 
        400, 
        validation.errors
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });

    if (!user) {
      return createErrorResponse(
        'User not found',
        404
      );
    }

    // Check if user is already verified
    if (user.isVerified) {
      return createErrorResponse(
        'User is already verified',
        400
      );
    }

    // Generate new OTP
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
        message: 'OTP sent successfully',
        otpExpiry: otpResult.expiresAt,
        // Only include OTP in development
        ...(process.env.NODE_ENV === 'development' && { otpCode: otpResult.otpCode })
      },
      'OTP sent successfully'
    );
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    
    return createErrorResponse(
      error.message || 'Failed to resend OTP',
      400
    );
  }
}