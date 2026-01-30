/**
 * Booking Validation Schema using Zod
 * Contains validation and sanitization rules for booking endpoints
 * 
 * BOOKING FLOW:
 * 1. Check availability → availabilitySchema
 * 2. Create booking → createBookingSchema
 * 3. View bookings → bookingQuerySchema
 * 4. Cancel booking → cancelBookingSchema
 */

import { z } from 'zod';

// Booking status enum for validation
const BookingStatus = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);
export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

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

// Future date validator (for bookings)
const futureDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }, 'Cannot book for past dates');

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

// ============================================
// AVAILABILITY CHECK SCHEMA
// ============================================
/**
 * Used when checking available time slots for a court on a specific date.
 * The courtId comes from URL params, not query params.
 */
export const availabilitySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate >= today;
    }, 'Cannot check availability for past dates')
});

// ============================================
// CANCEL BOOKING SCHEMA
// ============================================
export const cancelBookingSchema = z.object({
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
});

// ============================================
// CREATE BOOKING SCHEMA (Enhanced)
// ============================================
/**
 * CREATE BOOKING SCHEMA
 * 
 * LOGIC:
 * - courtId: Which court to book
 * - date: Which date (YYYY-MM-DD)
 * - startTime: Start time (HH:MM format, e.g., "09:00")
 * - endTime: End time (HH:MM format, e.g., "10:00")
 * 
 * TIME VALIDATION:
 * - Must be in HH:MM format
 * - endTime must be after startTime
 * - Minimum 1 hour booking
 */
export const createBookingSchema = z.object({
  courtId: idSchema,
  date: futureDateSchema,
  startTime: timeSchema,
  endTime: timeSchema
}).refine((data) => {
  // Validate endTime is after startTime
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  return toMinutes(data.endTime) > toMinutes(data.startTime);
}, {
  message: 'End time must be after start time',
  path: ['endTime']
}).refine((data) => {
  // Minimum 1 hour booking
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  return (toMinutes(data.endTime) - toMinutes(data.startTime)) >= 60;
}, {
  message: 'Minimum booking duration is 1 hour',
  path: ['endTime']
});

// Legacy booking validation schemas (for backward compatibility)
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

// ============================================
// TIME HELPER FUNCTIONS
// ============================================

/**
 * Generate time slots for a given date
 * 
 * LOGIC:
 * - Start from court's opening time
 * - End at court's closing time
 * - Each slot is 1 hour (default)
 * 
 * Example for court open 06:00 to 22:00:
 * ["06:00-07:00", "07:00-08:00", ..., "21:00-22:00"]
 * 
 * @param {string} openingTime - Court opening time "HH:MM"
 * @param {string} closingTime - Court closing time "HH:MM"
 * @param {number} slotDuration - Slot duration in minutes (default: 60)
 * @returns {Array} Array of time slot objects
 */
export function generateTimeSlots(openingTime, closingTime, slotDuration = 60) {
  const slots = [];
  
  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);
  
  let currentMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;
  
  while (currentMinutes + slotDuration <= endMinutes) {
    const startHour = Math.floor(currentMinutes / 60);
    const startMin = currentMinutes % 60;
    const endHour = Math.floor((currentMinutes + slotDuration) / 60);
    const endMin = (currentMinutes + slotDuration) % 60;
    
    slots.push({
      startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
    });
    
    currentMinutes += slotDuration;
  }
  
  return slots;
}

/**
 * Check if a time slot overlaps with existing bookings
 * 
 * LOGIC:
 * Two time ranges overlap if:
 * - Start1 < End2 AND Start2 < End1
 * 
 * @param {string} startTime - Requested start time "HH:MM"
 * @param {string} endTime - Requested end time "HH:MM"
 * @param {Array} existingBookings - Array of existing bookings with startTime/endTime
 * @returns {boolean} true if overlaps, false if available
 */
export function hasTimeConflict(startTime, endTime, existingBookings) {
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const reqStart = toMinutes(startTime);
  const reqEnd = toMinutes(endTime);
  
  for (const booking of existingBookings) {
    const bookStart = toMinutes(booking.startTime);
    const bookEnd = toMinutes(booking.endTime);
    
    // Check overlap: Start1 < End2 AND Start2 < End1
    if (reqStart < bookEnd && bookStart < reqEnd) {
      return true; // Conflict found
    }
  }
  
  return false; // No conflict
}

/**
 * Check if time is within operating hours
 * 
 * @param {string} startTime - Requested start time "HH:MM"
 * @param {string} endTime - Requested end time "HH:MM"
 * @param {string} openingTime - Court opening time "HH:MM"
 * @param {string} closingTime - Court closing time "HH:MM"
 * @returns {boolean} true if within operating hours
 */
export function isWithinOperatingHours(startTime, endTime, openingTime, closingTime) {
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const open = toMinutes(openingTime);
  const close = toMinutes(closingTime);
  
  return start >= open && end <= close;
}

/**
 * Calculate total amount for a booking
 * 
 * @param {string} startTime - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 * @param {number} pricePerHour - Price per hour for the court
 * @returns {number} Total amount
 */
export function calculateBookingAmount(startTime, endTime, pricePerHour) {
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const durationMinutes = toMinutes(endTime) - toMinutes(startTime);
  const hours = durationMinutes / 60;
  
  return Math.round(hours * pricePerHour * 100) / 100; // Round to 2 decimal places
}