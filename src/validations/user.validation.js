/**
 * User Validation Schemas
 * =======================
 * 
 * Zod schemas for user profile management endpoints.
 * Includes validation for:
 * - Profile updates (name, phone, preferences)
 * - Password changes
 * - Account settings
 * - Avatar uploads
 * 
 * @module validations/user.validation
 */

import { z } from 'zod';

// ==========================================
// COMMON FIELD VALIDATORS
// ==========================================

/**
 * Name validation
 * - 2-50 characters
 * - Trims whitespace
 * - Normalizes multiple spaces
 */
const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .transform(val => val.replace(/\s+/g, ' '));

/**
 * Phone validation
 * - Optional field
 * - Supports international format
 * - Allows spaces, dashes, parentheses
 */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Please provide a valid phone number')
  .optional()
  .nullable()
  .or(z.literal(''));

/**
 * Password validation
 * - Minimum 8 characters
 * - Must contain uppercase, lowercase, and number
 * - Maximum 128 characters for security
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /[a-z]/,
    'Password must contain at least one lowercase letter'
  )
  .regex(
    /[A-Z]/,
    'Password must contain at least one uppercase letter'
  )
  .regex(
    /\d/,
    'Password must contain at least one number'
  )
  .regex(
    /^[^\s]*$/,
    'Password must not contain spaces'
  );

/**
 * Avatar URL validation
 * - Must be valid URL or base64 data URI
 * - Optional field
 */
const avatarSchema = z
  .string()
  .url('Please provide a valid avatar URL')
  .optional()
  .nullable()
  .or(z.string().regex(/^data:image\/(jpeg|png|gif|webp);base64,/, 'Invalid image format'));

// ==========================================
// PROFILE UPDATE SCHEMA
// ==========================================

/**
 * Schema for updating user profile
 * PUT /api/users/profile
 * 
 * Allows partial updates - all fields optional
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  avatar: avatarSchema,
  
  // User preferences (JSON object)
  preferences: z.object({
    // Notification preferences
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    
    // Booking reminders
    reminderHours: z.number().min(1).max(48).optional(), // Hours before booking
    
    // Display preferences
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().max(5).optional(), // e.g., 'en', 'hi'
    
    // Default location for search
    defaultCity: z.string().max(50).optional(),
    
    // Favorite sports (for recommendations)
    favoriteSports: z.array(z.enum([
      'BADMINTON', 'TENNIS', 'FOOTBALL', 'CRICKET', 
      'BASKETBALL', 'TABLE_TENNIS', 'SWIMMING', 
      'SQUASH', 'VOLLEYBALL', 'OTHER'
    ])).optional()
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field is required for update'
});

// ==========================================
// PASSWORD CHANGE SCHEMA
// ==========================================

/**
 * Schema for changing password
 * PUT /api/users/password
 * 
 * Requires current password for security
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// ==========================================
// ACCOUNT DEACTIVATION SCHEMA
// ==========================================

/**
 * Schema for account deactivation/deletion
 * DELETE /api/users/account
 * 
 * Requires password confirmation for security
 */
export const deactivateAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for confirmation'),
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
  confirmText: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' })
  })
});

// ==========================================
// DASHBOARD QUERY SCHEMA
// ==========================================

/**
 * Schema for dashboard query parameters
 * GET /api/users/dashboard
 */
export const dashboardQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month'),
  includeStats: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
  includeUpcoming: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
  includeRecent: z.enum(['true', 'false']).default('true').transform(v => v === 'true')
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Validate request body against a schema
 * @param {Object} body - Request body to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {{ isValid: boolean, data?: Object, errors?: Array }}
 */
export function validateUserRequest(body, schema) {
  try {
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      };
    }
    
    return {
      isValid: true,
      data: result.data
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Validation error occurred' }]
    };
  }
}

/**
 * Validate query parameters
 * @param {URLSearchParams} searchParams - URL search params
 * @param {z.ZodSchema} schema - Zod schema
 * @returns {{ isValid: boolean, data?: Object, errors?: Array }}
 */
export function validateUserQuery(searchParams, schema) {
  const params = Object.fromEntries(searchParams.entries());
  return validateUserRequest(params, schema);
}

// ==========================================
// EXPORTS
// ==========================================

export const userValidation = {
  updateProfile: updateProfileSchema,
  changePassword: changePasswordSchema,
  deactivateAccount: deactivateAccountSchema,
  dashboardQuery: dashboardQuerySchema
};

export default userValidation;
