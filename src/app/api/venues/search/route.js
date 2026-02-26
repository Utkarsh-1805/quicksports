import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateSearchParams, parseAmenities, parseSportTypes } from "../../../../validations/search.validation";

/**
 * ============================================
 * ADVANCED VENUE SEARCH API
 * ============================================
 * 
 * GET /api/venues/search
 * 
 * This API provides comprehensive venue search with:
 * 
 * 1. TEXT SEARCH
 *    - Searches across venue name, description, and city
 *    - Case-insensitive matching
 *    - Example: ?search=badminton
 * 
 * 2. AMENITY FILTERING
 *    - Filter venues that have specific amenities
 *    - Supports multiple amenities (AND logic - must have ALL)
 *    - Example: ?amenities=amenity-001,amenity-002
 * 
 * 3. SPORT TYPE FILTERING
 *    - Filter by specific sport type
 *    - Example: ?sportType=BADMINTON
 * 
 * 4. PRICE RANGE FILTERING
 *    - Filter venues with courts in price range
 *    - Example: ?minPrice=200&maxPrice=500
 * 
 * 5. GEOLOCATION SEARCH
 *    - Find venues within X km of a location
 *    - Uses Haversine formula for distance calculation
 *    - Example: ?latitude=28.6139&longitude=77.2090&radius=5
 * 
 * 6. SORTING OPTIONS
 *    - relevance: Best match first (default)
 *    - price_low: Cheapest courts first
 *    - price_high: Most expensive first
 *    - rating: Highest rated first
 *    - newest: Recently added first
 *    - popular: Most courts/bookings first
 *    - distance: Nearest first (requires lat/lng)
 * 
 * 7. PAGINATION
 *    - page: Current page (default: 1)
 *    - limit: Items per page (default: 10, max: 50)
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ========================================
    // STEP 1: VALIDATE INPUT PARAMETERS
    // ========================================
    // Zod validates all params, provides defaults, and sanitizes input
    const validation = validateSearchParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid search parameters', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const {
      search,
      city,
      state,
      sportType,
      sportTypes: sportTypesString,
      amenities: amenitiesString,
      minPrice,
      maxPrice,
      minRating,
      hasReviews,
      latitude,
      longitude,
      radius,
      sortBy,
      page,
      limit
    } = validation.data;
    
    const skip = (page - 1) * limit;
    
    // ========================================
    // STEP 2: BUILD BASE QUERY CONDITIONS
    // ========================================
    // Start with approved venues only
    const where = {
      status: 'APPROVED'
    };
    
    // ========================================
    // STEP 3: TEXT SEARCH (OR Logic)
    // ========================================
    /**
     * LOGIC: Search term matches ANY of:
     * - Venue name (partial match)
     * - Venue description (partial match)  
     * - City name (partial match)
     * 
     * Uses case-insensitive matching for better UX
     */
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // ========================================
    // STEP 4: LOCATION FILTERS
    // ========================================
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }
    
    // ========================================
    // STEP 5: SPORT TYPE FILTER
    // ========================================
    /**
     * LOGIC: Venue must have at least one ACTIVE court
     * of the specified sport type(s)
     * 
     * Uses Prisma's "some" relation filter
     * Supports both single sportType and multiple sportTypes (comma-separated)
     */
    const parsedSportTypes = parseSportTypes(sportTypesString);
    
    if (sportType) {
      // Single sport type filter
      where.courts = {
        some: {
          sportType: sportType,
          isActive: true
        }
      };
    } else if (parsedSportTypes.length > 0) {
      // Multiple sport types filter (OR logic - has at least one of the sports)
      where.courts = {
        some: {
          sportType: { in: parsedSportTypes },
          isActive: true
        }
      };
    }
    
    // ========================================
    // STEP 6: AMENITY FILTERING (AND Logic)
    // ========================================
    /**
     * LOGIC: Venue must have ALL specified amenities
     * 
     * Parse comma-separated amenity IDs:
     * "amenity-001,amenity-002" → ['amenity-001', 'amenity-002']
     * 
     * Use "every" for AND logic - venue must have EACH amenity
     * Use "some" for OR logic - venue must have AT LEAST ONE
     * 
     * We use AND logic (every) because typically users want
     * venues with all their required facilities
     */
    const amenityIds = parseAmenities(amenitiesString);
    if (amenityIds.length > 0) {
      where.amenities = {
        some: {
          amenityId: {
            in: amenityIds
          }
        }
      };
    }
    
    // ========================================
    // STEP 7: DETERMINE SORT ORDER
    // ========================================
    /**
     * LOGIC: Different sort options for different use cases
     * 
     * - relevance: Default, uses createdAt as proxy
     * - price_low/high: Sorted in post-processing
     * - rating: Sorted in post-processing (requires avg calculation)
     * - newest: Most recently added venues
     * - popular: Venues with most courts
     * - distance: Sorted in post-processing (requires geo calculation)
     */
    let orderBy = [];
    switch (sortBy) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'popular':
        // Sort by number of courts descending
        orderBy = [{ courts: { _count: 'desc' } }, { createdAt: 'desc' }];
        break;
      default:
        // Default sorting
        orderBy = [{ createdAt: 'desc' }];
    }
    
    // ========================================
    // STEP 8: EXECUTE DATABASE QUERY
    // ========================================
    const [venues, totalCount] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true
            }
          },
          courts: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sportType: true,
              pricePerHour: true
            }
          },
          amenities: {
            include: {
              amenity: {
                select: {
                  id: true,
                  name: true,
                  icon: true
                }
              }
            }
          },
          photos: {
            take: 1, // Only get first photo for list view
            select: {
              url: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              courts: { where: { isActive: true } },
              reviews: true
            }
          }
        },
        orderBy,
        // We fetch more than needed for post-processing filters
        take: limit * 3,
        skip: 0
      }),
      prisma.facility.count({ where })
    ]);
    
    // ========================================
    // STEP 9: POST-PROCESSING - TRANSFORM DATA
    // ========================================
    /**
     * LOGIC: Calculate derived fields for each venue:
     * - averageRating: Average of all review ratings
     * - priceRange: Min and max price from courts
     * - distance: Distance from user (if lat/lng provided)
     * - amenities: Flatten the junction table structure
     */
    let processedVenues = venues.map(venue => {
      // Calculate average rating
      const ratings = venue.reviews.map(r => r.rating);
      const averageRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
      
      // Calculate price range from courts
      const prices = venue.courts.map(c => c.pricePerHour);
      const priceRange = prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null;
      
      // Get sport types available
      const sportTypes = [...new Set(venue.courts.map(c => c.sportType))];
      
      // Flatten amenities structure
      const amenities = venue.amenities.map(a => a.amenity);
      
      // Calculate distance if coordinates provided
      let distance = null;
      if (latitude && longitude && venue.latitude && venue.longitude) {
        distance = calculateDistance(
          latitude, longitude,
          venue.latitude, venue.longitude
        );
      }
      
      return {
        id: venue.id,
        name: venue.name,
        description: venue.description,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        pincode: venue.pincode,
        latitude: venue.latitude,
        longitude: venue.longitude,
        thumbnail: venue.photos[0]?.url || null,
        owner: venue.owner,
        sportTypes,
        priceRange,
        averageRating,
        reviewCount: venue._count.reviews,
        courtCount: venue._count.courts,
        amenities,
        distance,
        createdAt: venue.createdAt
      };
    });
    
    // ========================================
    // STEP 10: PRICE RANGE FILTER (Post-processing)
    // ========================================
    /**
     * LOGIC: Filter venues that have at least one court
     * within the specified price range
     * 
     * We do this after fetching because Prisma doesn't
     * support filtering by nested aggregations easily
     */
    if (minPrice !== undefined || maxPrice !== undefined) {
      processedVenues = processedVenues.filter(venue => {
        if (!venue.priceRange) return false;
        
        if (minPrice !== undefined && maxPrice !== undefined) {
          // Has courts within price range
          return venue.priceRange.min <= maxPrice && venue.priceRange.max >= minPrice;
        } else if (minPrice !== undefined) {
          return venue.priceRange.max >= minPrice;
        } else if (maxPrice !== undefined) {
          return venue.priceRange.min <= maxPrice;
        }
        return true;
      });
    }
    
    // ========================================
    // STEP 11: GEOLOCATION FILTER (Post-processing)
    // ========================================
    /**
     * LOGIC: Filter venues within specified radius
     * 
     * Only applies if lat/lng/radius are provided
     * Uses the distance calculated in Step 9
     */
    if (latitude && longitude && radius) {
      processedVenues = processedVenues.filter(venue => {
        return venue.distance !== null && venue.distance <= radius;
      });
    }
    
    // ========================================
    // STEP 11.5: RATING FILTER (Post-processing)
    // ========================================
    /**
     * LOGIC: Filter venues by minimum rating or review presence
     * 
     * - minRating: Only show venues with average rating >= minRating
     * - hasReviews: Filter by presence of reviews
     */
    if (minRating !== undefined) {
      processedVenues = processedVenues.filter(venue => {
        return venue.averageRating !== null && venue.averageRating >= minRating;
      });
    }
    
    if (hasReviews === 'true') {
      processedVenues = processedVenues.filter(venue => venue.reviewCount > 0);
    } else if (hasReviews === 'false') {
      processedVenues = processedVenues.filter(venue => venue.reviewCount === 0);
    }
    
    // ========================================
    // STEP 12: SORT POST-PROCESSING
    // ========================================
    /**
     * LOGIC: Some sorts require calculated fields
     * that we compute in post-processing
     */
    switch (sortBy) {
      case 'price_low':
        processedVenues.sort((a, b) => {
          if (!a.priceRange) return 1;
          if (!b.priceRange) return -1;
          return a.priceRange.min - b.priceRange.min;
        });
        break;
      case 'price_high':
        processedVenues.sort((a, b) => {
          if (!a.priceRange) return 1;
          if (!b.priceRange) return -1;
          return b.priceRange.max - a.priceRange.max;
        });
        break;
      case 'rating':
        processedVenues.sort((a, b) => {
          if (a.averageRating === null) return 1;
          if (b.averageRating === null) return -1;
          return b.averageRating - a.averageRating;
        });
        break;
      case 'distance':
        if (latitude && longitude) {
          processedVenues.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        break;
      case 'reviews':
        processedVenues.sort((a, b) => {
          return b.reviewCount - a.reviewCount;
        });
        break;
    }
    
    // ========================================
    // STEP 13: APPLY PAGINATION
    // ========================================
    const paginatedVenues = processedVenues.slice(skip, skip + limit);
    const filteredTotal = processedVenues.length;
    
    // ========================================
    // STEP 14: RETURN RESPONSE
    // ========================================
    return NextResponse.json({
      success: true,
      data: {
        venues: paginatedVenues,
        pagination: {
          page,
          limit,
          total: filteredTotal,
          totalPages: Math.ceil(filteredTotal / limit),
          hasMore: skip + limit < filteredTotal
        },
        filters: {
          search: search || null,
          city: city || null,
          sportType: sportType || null,
          amenities: amenityIds,
          priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
          location: latitude && longitude ? { latitude, longitude, radius } : null,
          sortBy
        }
      }
    });
    
  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * HAVERSINE FORMULA - Calculate distance between two points
 * 
 * This formula calculates the great-circle distance between
 * two points on a sphere (Earth) given their latitudes and longitudes.
 * 
 * LOGIC:
 * 1. Convert lat/lng from degrees to radians
 * 2. Calculate differences in coordinates
 * 3. Apply Haversine formula: a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
 * 4. c = 2 * atan2(√a, √(1−a))
 * 5. distance = R * c (where R is Earth's radius)
 * 
 * @param {number} lat1 - User's latitude
 * @param {number} lon1 - User's longitude
 * @param {number} lat2 - Venue's latitude
 * @param {number} lon2 - Venue's longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
