import { z } from 'zod';

/**
 * SEARCH VALIDATION SCHEMAS
 * ========================
 * 
 * These schemas validate all search-related API parameters.
 * Using Zod for type-safe validation with detailed error messages.
 */

// Valid sport types in the system
const sportTypes = ['BADMINTON', 'TENNIS', 'BASKETBALL', 'FOOTBALL', 'TABLE_TENNIS', 'SWIMMING', 'CRICKET', 'VOLLEYBALL'];

// Valid sorting options for venue search
const sortOptions = ['relevance', 'price_low', 'price_high', 'rating', 'newest', 'popular', 'distance'];

/**
 * ADVANCED VENUE SEARCH SCHEMA
 * 
 * Supports:
 * - Text search (name, description, city)
 * - Sport type filtering
 * - Amenity-based filtering (multiple amenities)
 * - Price range filtering
 * - Geolocation-based search (lat/lng + radius)
 * - Sorting options
 * - Pagination
 */
export const advancedSearchSchema = z.object({
  // Text search - searches name, description, city
  search: z.string().max(100).optional(),
  
  // Location filters
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  
  // Sport type filter - can be single or multiple
  sportType: z.enum(sportTypes).optional(),
  sportTypes: z.array(z.enum(sportTypes)).optional(), // Multiple sports
  
  // Amenity filtering - comma-separated amenity IDs
  // Example: "amenity-001,amenity-002,amenity-003"
  amenities: z.string().optional(),
  
  // Price range filtering
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  
  // Geolocation search (find venues near a location)
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).default(10), // km, default 10km
  
  // Sorting options
  sortBy: z.enum(sortOptions).default('relevance'),
  
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

/**
 * SEARCH SUGGESTIONS SCHEMA
 * 
 * For autocomplete functionality - returns matching cities and venue names
 */
export const searchSuggestionsSchema = z.object({
  query: z.string().min(2).max(50), // Minimum 2 chars for suggestions
  type: z.enum(['all', 'cities', 'venues', 'sports']).default('all'),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

/**
 * NEARBY VENUES SCHEMA
 * 
 * Specifically for location-based search
 */
export const nearbyVenuesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(10), // km
  sportType: z.enum(sportTypes).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

/**
 * VALIDATION HELPER FUNCTIONS
 */

// Parse and validate search parameters from URL
export function validateSearchParams(searchParams) {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const result = advancedSearchSchema.safeParse(params);
    
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    
    return { isValid: true, data: result.data };
  } catch (error) {
    return { isValid: false, errors: [{ field: 'general', message: error.message }] };
  }
}

// Parse amenities string into array of IDs
export function parseAmenities(amenitiesString) {
  if (!amenitiesString) return [];
  return amenitiesString.split(',').map(id => id.trim()).filter(Boolean);
}

// Validate suggestions parameters
export function validateSuggestionsParams(searchParams) {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const result = searchSuggestionsSchema.safeParse(params);
    
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    
    return { isValid: true, data: result.data };
  } catch (error) {
    return { isValid: false, errors: [{ field: 'general', message: error.message }] };
  }
}

// Validate nearby venues parameters
export function validateNearbyParams(searchParams) {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const result = nearbyVenuesSchema.safeParse(params);
    
    if (!result.success) {
      return {
        isValid: false,
        errors: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    
    return { isValid: true, data: result.data };
  } catch (error) {
    return { isValid: false, errors: [{ field: 'general', message: error.message }] };
  }
}
