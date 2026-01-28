/**
 * Auth Validation Schema using Zod
 * Contains validation and sanitization rules for authentication endpoints
 */

import { z } from 'zod';

// User roles enum for validation
const UserRole = z.enum(['USER', 'FACILITY_OWNER', 'ADMIN']);

// Common field validators with sanitization
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please provide a valid email address')
  .regex(emailRegex, 'Email format is invalid');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain uppercase, lowercase, and number');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .transform(val => val.replace(/\s+/g, ' ')); // Normalize spaces

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number')
  .optional()
  .or(z.literal(''));

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be a 6-digit number');

// Auth validation schemas
export const authValidation = {
  register: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    phone: phoneSchema,
    role: UserRole.default('USER')
  }),

  login: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  }),

  verifyOtp: z.object({
    email: emailSchema,
    code: otpCodeSchema
  }),

  resendOtp: z.object({
    email: emailSchema
  })
};

/**
 * Validates and sanitizes request body using Zod schema
 * @param {Object} data - Request body data
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Object} - { isValid: boolean, data?: Object, errors?: string[] }
 */
export function validateRequest(data, schema) {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError && Array.isArray(error.errors)) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return {
        isValid: false,
        errors
      };
    }
    // Always return an array for errors
    return {
      isValid: false,
      errors: [error.message || 'Validation failed']
    };
  }
}