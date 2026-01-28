/**
 * User Login API Route
 * POST /api/auth/login
 */

import { AuthService } from '../../../../services/auth.service.js';
import { authValidation, validateRequest } from '../../../../validations/auth.validation.js';
import { createResponse, createErrorResponse } from '../../../../lib/auth.js';

const authService = new AuthService();

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate and sanitize request body
    const validation = validateRequest(body, authValidation.login);
    if (!validation.isValid) {
      return createErrorResponse(
        'Validation failed', 
        400, 
        validation.errors
      );
    }

    // Login user with sanitized data
    const result = await authService.loginUser(
      validation.data.email,
      validation.data.password
    );
    
    return createResponse(
      result,
      'Login successful'
    );
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Generic error message for security
    return createErrorResponse(
      error.message || 'Login failed',
      401
    );
  }
}