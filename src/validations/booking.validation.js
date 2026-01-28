/**
 * Booking Validation Schema using Zod
 * Contains validation and sanitization rules for booking endpoints
 */

import { z } from 'zod';

// Booking status enum for validation
const BookingStatus = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);

// Date and time validators
const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .transform(val => {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return val;
  });

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');

const durationSchema = z
  .number()
  .positive('Duration must be positive')
  .max(8, 'Duration cannot exceed 8 hours')
  .or(z.string().transform(val => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0 || num > 8) {
      throw new Error('Duration must be between 0 and 8 hours');
    }
    return num;
  }));

const priceSchema = z
  .number()
  .positive('Price must be positive')
  .or(z.string().transform(val => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid price');
    }
    return num;
  }));

// ID validation for references
const idSchema = z
  .string()
  .trim()
  .min(1, 'ID is required');

// Booking validation schemas
export const bookingValidation = {
  createBooking: z.object({
    courtId: idSchema,
    date: dateSchema,
    startTime: timeSchema,
    duration: durationSchema,
    totalAmount: priceSchema
  }).refine(data => {
    // Validate that the booking is not in the past
    const bookingDate = new Date(`${data.date}T${data.startTime}`);
    const now = new Date();
    return bookingDate > now;
  }, {
    message: 'Booking date and time must be in the future',
    path: ['date']
  }),

  updateBooking: z.object({
    date: dateSchema.optional(),
    startTime: timeSchema.optional(),
    duration: durationSchema.optional(),
    totalAmount: priceSchema.optional(),
    status: BookingStatus.optional()
  }).partial(),

  // Query parameter validation
  bookingQuery: z.object({
    page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z.string().transform(val => Math.min(50, Math.max(1, parseInt(val) || 10))),
    status: BookingStatus.optional(),
    courtId: idSchema.optional(),
    facilityId: idSchema.optional(),
    fromDate: dateSchema.optional(),
    toDate: dateSchema.optional()
  }).partial().refine(data => {
    // Validate date range if both fromDate and toDate are provided
    if (data.fromDate && data.toDate) {
      return new Date(data.fromDate) <= new Date(data.toDate);
    }
    return true;
  }, {
    message: 'fromDate must be before or equal to toDate',
    path: ['fromDate']
  })
};

/**
 * Validates and sanitizes query parameters using Zod schema
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Object} - { isValid: boolean, data?: Object, errors?: string[] }
 */
export function validateQueryParams(searchParams, schema) {
  try {
    const params = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    const validatedData = schema.parse(params);
    return {
      isValid: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: ['Query validation failed']
    };
  }
}

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
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: ['Validation failed']
    };
  }
}