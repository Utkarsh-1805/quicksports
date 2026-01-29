import { z } from 'zod';

// Home page query parameters validation
export const homeQuerySchema = z.object({
  venueLimit: z.coerce.number().int().min(1).max(20).default(6),
  sportsLimit: z.coerce.number().int().min(1).max(12).default(8),
});

// Featured venues query
export const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
  city: z.string().trim().optional(),
});

// Helper to validate query params
export const validateHomeQuery = (searchParams) => {
  try {
    const params = {
      venueLimit: searchParams.get('venueLimit') || undefined,
      sportsLimit: searchParams.get('sportsLimit') || undefined,
    };
    
    const result = homeQuerySchema.safeParse(params);
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.flatten().fieldErrors,
      };
    }
    return { isValid: true, data: result.data };
  } catch (error) {
    return { isValid: false, errors: { general: ['Invalid query parameters'] } };
  }
};
