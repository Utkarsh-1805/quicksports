import { z } from 'zod';

// Create review validation
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(1000, 'Comment must be under 1000 characters').optional(),
});

// Update review validation
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional(),
}).refine(data => data.rating !== undefined || data.comment !== undefined, {
  message: 'At least rating or comment must be provided',
});

// Review query params
export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['recent', 'highest', 'lowest']).default('recent'),
});

// Helper to validate review data
export const validateReview = (data, schema = createReviewSchema) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.flatten().fieldErrors,
    };
  }
  return { isValid: true, data: result.data };
};

// Helper to validate query params
export const validateReviewQuery = (searchParams) => {
  try {
    const params = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sort: searchParams.get('sort') || undefined,
    };
    
    const result = reviewQuerySchema.safeParse(params);
    if (!result.success) {
      return { isValid: false, errors: result.error.flatten().fieldErrors };
    }
    return { isValid: true, data: result.data };
  } catch (error) {
    return { isValid: false, errors: { general: ['Invalid query parameters'] } };
  }
};
