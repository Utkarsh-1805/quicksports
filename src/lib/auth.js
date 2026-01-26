/**
 * JWT Authentication Middleware
 * Validates JWT tokens and attaches user data to request
 */

import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

/**
 * Middleware to verify JWT token
 * @param {Request} request 
 * @returns {Object} - { user, error? }
 */
export async function verifyAuthToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Token missing');
    }

    const decoded = await authService.verifyToken(token);
    
    return { user: decoded.user };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Middleware to check if user has required role
 * @param {Object} user 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
export function hasRole(user, allowedRoles) {
  return allowedRoles.includes(user.role);
}

/**
 * Extract bearer token from authorization header
 * @param {Request} request 
 * @returns {string|null}
 */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Create standard API response
 * @param {Object} data 
 * @param {string} message 
 * @param {number} status 
 * @returns {Response}
 */
export function createResponse(data = null, message = 'Success', status = 200) {
  return new Response(
    JSON.stringify({
      success: status < 400,
      message,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create error response
 * @param {string} message 
 * @param {number} status 
 * @param {string[]} errors 
 * @returns {Response}
 */
export function createErrorResponse(message, status = 400, errors = []) {
  return new Response(
    JSON.stringify({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}