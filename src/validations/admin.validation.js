import { z } from 'zod';

// Admin venue action validation (used for approve/reject actions)
export const adminVenueActionSchema = z.object({
  adminNote: z.string()
    .min(10, 'Admin note must be at least 10 characters')
    .max(500, 'Admin note must be less than 500 characters')
    .trim(),
  autoNotify: z.boolean().optional().default(true)
});

// Admin venue status update validation (consolidated approve/reject)
export const adminVenueStatusUpdateSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either "approve" or "reject"' })
  }),
  adminNote: z.string()
    .min(10, 'Admin note must be at least 10 characters')
    .max(500, 'Admin note must be less than 500 characters')
    .trim()
    .transform(val => val.replace(/\s+/g, ' ')), // Normalize whitespace
  autoNotify: z.boolean()
    .optional()
    .default(true)
    .transform(val => Boolean(val))
});

// Admin venue query parameters with sanitization
export const adminVenueQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.string()
    .optional()
    .default('1')
    .transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string()
    .optional() 
    .default('20')
    .transform(val => Math.min(50, Math.max(1, parseInt(val) || 20))),
  search: z.string()
    .optional()
    .transform(val => val?.trim().replace(/\s+/g, ' ')),
  city: z.string()
    .optional()
    .transform(val => val?.trim()),
  ownerId: z.string()
    .optional()
    .refine(val => !val || /^[a-zA-Z0-9]+$/.test(val), 'Invalid owner ID format')
});

// User management validation with sanitization
export const adminUserQuerySchema = z.object({
  role: z.enum(['USER', 'FACILITY_OWNER', 'ADMIN']).optional(),
  isVerified: z.enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),
  page: z.string()
    .optional()
    .default('1') 
    .transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string()
    .optional()
    .default('20')
    .transform(val => Math.min(50, Math.max(1, parseInt(val) || 20))),
  search: z.string()
    .optional()
    .transform(val => val?.trim().replace(/\s+/g, ' '))
});

// Admin user role update with sanitization
export const adminUserRoleSchema = z.object({
  role: z.enum(['USER', 'FACILITY_OWNER', 'ADMIN'], {
    errorMap: () => ({ message: 'Invalid role. Must be USER, FACILITY_OWNER, or ADMIN' })
  }),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(255, 'Reason must be less than 255 characters')
    .trim()
    .transform(val => val.replace(/\s+/g, ' ')) // Normalize whitespace
});

// Validation helper functions
export function validateAdminVenueAction(data) {
  try {
    return {
      success: true,
      data: adminVenueActionSchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
}

export function validateAdminVenueQuery(params) {
  try {
    const queryParams = {};
    for (const [key, value] of params.entries()) {
      queryParams[key] = value;
    }
    
    return {
      success: true,
      data: adminVenueQuerySchema.parse(queryParams)
    };
  } catch (error) {
    return {
      success: false,
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
}