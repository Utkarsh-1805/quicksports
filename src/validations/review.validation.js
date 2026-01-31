import { z } from 'zod';

// Create review validation
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title must be under 100 characters').optional(),
  comment: z.string().trim().max(2000, 'Comment must be under 2000 characters').optional(),
});

// Update review validation
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().min(3).max(100).optional().nullable(),
  comment: z.string().trim().max(2000).optional().nullable(),
}).refine(data => data.rating !== undefined || data.comment !== undefined || data.title !== undefined, {
  message: 'At least rating, title, or comment must be provided',
});

// Owner response validation
export const ownerResponseSchema = z.object({
  response: z.string().trim().min(10, 'Response must be at least 10 characters').max(1000, 'Response must be under 1000 characters'),
});

// Flag review validation
export const flagReviewSchema = z.object({
  reason: z.enum([
    'SPAM',
    'INAPPROPRIATE',
    'FAKE_REVIEW',
    'HARASSMENT',
    'OFF_TOPIC',
    'OTHER'
  ]),
  details: z.string().trim().max(500, 'Details must be under 500 characters').optional(),
});

// Admin moderation validation
export const moderationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().trim().max(500).optional(),
});

// Review query params
export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['recent', 'highest', 'lowest', 'helpful']).default('recent'),
  filter: z.enum(['all', 'verified', 'with_response']).default('all').optional(),
});

// Admin review query params
export const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'approved', 'flagged', 'all']).default('all'),
  venueId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
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
      filter: searchParams.get('filter') || undefined,
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

// Helper to validate admin query params
export const validateAdminReviewQuery = (searchParams) => {
  try {
    const params = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
      venueId: searchParams.get('venueId') || undefined,
      userId: searchParams.get('userId') || undefined,
      minRating: searchParams.get('minRating') || undefined,
      maxRating: searchParams.get('maxRating') || undefined,
    };
    
    const result = adminReviewQuerySchema.safeParse(params);
    if (!result.success) {
      return { isValid: false, errors: result.error.flatten().fieldErrors };
    }
    return { isValid: true, data: result.data };
  } catch (error) {
    return { isValid: false, errors: { general: ['Invalid query parameters'] } };
  }
};
