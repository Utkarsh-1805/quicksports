/**
 * Facility Validation Schema using Zod
 * Contains validation and sanitization rules for facility endpoints
 */

import { z } from 'zod';

// Facility status enum for validation
const FacilityStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// Sport type enum for validation
const SportType = z.enum([
  'BADMINTON', 'TENNIS', 'FOOTBALL', 'CRICKET', 
  'BASKETBALL', 'TABLE_TENNIS', 'SWIMMING', 
  'SQUASH', 'VOLLEYBALL', 'OTHER'
]);

// Common field validators with sanitization
const nameSchema = z
  .string()
  .trim()
  .min(3, 'Name must be at least 3 characters')
  .max(100, 'Name must not exceed 100 characters')
  .transform(val => val.replace(/\s+/g, ' ')); // Normalize spaces

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, 'Description must not exceed 1000 characters')
  .optional()
  .or(z.literal(''));

const addressSchema = z
  .string()
  .trim()
  .min(10, 'Address must be at least 10 characters')
  .max(200, 'Address must not exceed 200 characters');

const citySchema = z
  .string()
  .trim()
  .min(2, 'City must be at least 2 characters')
  .max(50, 'City must not exceed 50 characters')
  .transform(val => val.replace(/\s+/g, ' '));

const stateSchema = z
  .string()
  .trim()
  .min(2, 'State must be at least 2 characters')
  .max(50, 'State must not exceed 50 characters')
  .transform(val => val.replace(/\s+/g, ' '));

const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Pincode must be a 6-digit number');

const coordinateSchema = z
  .number()
  .or(z.string().transform(val => parseFloat(val)))
  .refine(val => !isNaN(val), 'Must be a valid number')
  .optional();

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

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');

// Facility validation schemas
export const facilityValidation = {
  createFacility: z.object({
    name: nameSchema,
    description: descriptionSchema,
    address: addressSchema,
    city: citySchema,
    state: stateSchema,
    pincode: pincodeSchema,
    latitude: coordinateSchema,
    longitude: coordinateSchema
  }),

  updateFacility: z.object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    address: addressSchema.optional(),
    city: citySchema.optional(),
    state: stateSchema.optional(),
    pincode: pincodeSchema.optional(),
    latitude: coordinateSchema,
    longitude: coordinateSchema,
    status: FacilityStatus.optional()
  }).partial(),

  createCourt: z.object({
    name: nameSchema,
    description: descriptionSchema,
    sportType: SportType,
    pricePerHour: priceSchema,
    openingTime: timeSchema.default('06:00'),
    closingTime: timeSchema.default('22:00')
  }),

  updateCourt: z.object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    sportType: SportType.optional(),
    pricePerHour: priceSchema.optional(),
    openingTime: timeSchema.optional(),
    closingTime: timeSchema.optional(),
    isActive: z.boolean().optional()
  }).partial(),

  // Query parameter validation
  facilityQuery: z.object({
    page: z.string().optional().transform(val => Math.max(1, parseInt(val) || 1)),
    limit: z.string().optional().transform(val => Math.min(50, Math.max(1, parseInt(val) || 10))),
    city: z.string().trim().optional(),
    sportType: SportType.optional(),
    search: z.string().trim().max(100).optional(),
    minPrice: z.string().transform(val => {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : Math.max(0, num);
    }).optional(),
    maxPrice: z.string().transform(val => {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : Math.max(0, num);
    }).optional()
  }).partial()
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