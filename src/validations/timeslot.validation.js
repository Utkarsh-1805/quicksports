import { z } from 'zod';

// Base time validation
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Single time slot validation
export const timeSlotSchema = z.object({
  date: z.string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .refine(dateStr => {
      const date = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'Cannot create time slots for past dates'),
    
  startTime: z.string()
    .regex(timeRegex, 'Start time must be in HH:MM format'),
    
  endTime: z.string()
    .regex(timeRegex, 'End time must be in HH:MM format'),
    
  isBlocked: z.boolean().optional().default(false),
  
  blockReason: z.string()
    .max(255, 'Block reason must be less than 255 characters')
    .optional()
}).refine(data => {
  // Validate time order
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
}).refine(data => {
  // Validate minimum duration (15 minutes)
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) >= 15;
}, {
  message: 'Time slot must be at least 15 minutes long',
  path: ['endTime']
});

// Bulk time slot creation validation
export const bulkTimeSlotSchema = z.object({
  dateRange: z.object({
    startDate: z.string()
      .regex(dateRegex, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string()
      .regex(dateRegex, 'End date must be in YYYY-MM-DD format')
  }).refine(data => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return start >= today && end >= start;
  }, 'Invalid date range'),
  
  timeSlots: z.array(z.object({
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format')
  })).min(1, 'At least one time slot is required')
    .refine(slots => {
      // Validate each time slot
      return slots.every(slot => {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return endMinutes > startMinutes && (endMinutes - startMinutes) >= 15;
      });
    }, 'All time slots must be valid and at least 15 minutes long')
    .refine(slots => {
      // Check for overlapping time slots
      const sortedSlots = slots.sort((a, b) => {
        const aStart = a.startTime.split(':').map(Number);
        const bStart = b.startTime.split(':').map(Number);
        return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1]);
      });
      
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];
        
        const [currentEndHour, currentEndMin] = current.endTime.split(':').map(Number);
        const [nextStartHour, nextStartMin] = next.startTime.split(':').map(Number);
        
        const currentEndMinutes = currentEndHour * 60 + currentEndMin;
        const nextStartMinutes = nextStartHour * 60 + nextStartMin;
        
        if (currentEndMinutes > nextStartMinutes) {
          return false; // Overlapping slots
        }
      }
      return true;
    }, 'Time slots cannot overlap'),
    
  excludeDates: z.array(z.string().regex(dateRegex))
    .optional()
    .default([]),
    
  isBlocked: z.boolean().optional().default(false),
  
  blockReason: z.string()
    .max(255, 'Block reason must be less than 255 characters')
    .optional()
}).refine(data => {
  const maxRange = 90; // 3 months
  const start = new Date(data.dateRange.startDate);
  const end = new Date(data.dateRange.endDate);
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  return diffDays <= maxRange;
}, 'Date range cannot exceed 90 days');

// Query parameters validation
export const timeSlotQuerySchema = z.object({
  date: z.string().regex(dateRegex).optional(),
  startDate: z.string().regex(dateRegex).optional(),
  endDate: z.string().regex(dateRegex).optional(),
  available: z.enum(['true', 'false']).optional(),
  blocked: z.enum(['true', 'false']).optional()
}).refine(data => {
  // If using date range, both start and end are required
  if (data.startDate || data.endDate) {
    return data.startDate && data.endDate;
  }
  return true;
}, 'Both startDate and endDate are required when using date range');

// Helper functions
export function validateTimeSlot(data) {
  try {
    return {
      success: true,
      data: timeSlotSchema.parse(data)
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

export function validateBulkTimeSlots(data) {
  try {
    return {
      success: true,
      data: bulkTimeSlotSchema.parse(data)
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

export function validateTimeSlotQuery(params) {
  try {
    return {
      success: true,
      data: timeSlotQuerySchema.parse(params)
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