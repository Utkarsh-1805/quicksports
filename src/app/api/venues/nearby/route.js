import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateNearbyParams } from "../../../../validations/search.validation";

/**
 * ============================================
 * NEARBY VENUES API (Location-based Discovery)
 * ============================================
 * 
 * GET /api/venues/nearby
 * 
 * This API finds venues near a given location using geolocation.
 * Optimized for mobile apps and location-aware web experiences.
 * 
 * REQUIRED PARAMS:
 * - latitude: User's latitude (e.g., 28.6139)
 * - longitude: User's longitude (e.g., 77.2090)
 * 
 * OPTIONAL PARAMS:
 * - radius: Search radius in km (default: 10, max: 50)
 * - sportType: Filter by sport type
 * - limit: Max results (default: 10, max: 20)
 * 
 * USE CASES:
 * 1. "Find badminton courts near me"
 * 2. "Show nearby venues within 5km"
 * 3. "What sports facilities are around?"
 * 
 * EXAMPLE:
 * /api/venues/nearby?latitude=28.6139&longitude=77.2090&radius=5
 * 
 * RESPONSE:
 * - Venues sorted by distance (nearest first)
 * - Each venue includes calculated distance
 * - Quick info: name, sports, rating, distance
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ========================================
    // STEP 1: VALIDATE INPUT
    // ========================================
    const validation = validateNearbyParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Location is required', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const { latitude, longitude, radius, sportType, limit } = validation.data;
    
    // ========================================
    // STEP 2: BUILD QUERY CONDITIONS
    // ========================================
    const where = {
      status: 'APPROVED',
      // Only venues that have coordinates
      latitude: { not: null },
      longitude: { not: null }
    };
    
    // Filter by sport type if specified
    if (sportType) {
      where.courts = {
        some: {
          sportType: sportType,
          isActive: true
        }
      };
    }
    
    // ========================================
    // STEP 3: FETCH ALL VENUES WITH COORDINATES
    // ========================================
    /**
     * LOGIC:
     * Prisma doesn't support native geospatial queries,
     * so we fetch all venues with coordinates and filter in JS.
     * 
     * For production at scale, consider:
     * 1. PostGIS extension for PostgreSQL
     * 2. Raw SQL queries with ST_DWithin
     * 3. Caching nearby results
     * 4. Grid-based indexing
     * 
     * Current approach works well for moderate data sizes.
     */
    const venues = await prisma.facility.findMany({
      where,
      include: {
        courts: {
          where: { isActive: true },
          select: {
            id: true,
            sportType: true,
            pricePerHour: true
          }
        },
        photos: {
          take: 1,
          select: {
            url: true
          }
        },
        reviews: {
          select: {
            rating: true
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
        _count: {
          select: {
            reviews: true
          }
        }
      }
    });
    
    // ========================================
    // STEP 4: CALCULATE DISTANCES & FILTER
    // ========================================
    /**
     * LOGIC:
     * 1. Calculate distance from user to each venue
     * 2. Filter venues within specified radius
     * 3. Sort by distance (nearest first)
     * 4. Apply limit
     * 
     * Haversine formula gives "as the crow flies" distance,
     * which is good for search but actual travel distance may vary.
     */
    const venuesWithDistance = venues
      .map(venue => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          venue.latitude, 
          venue.longitude
        );
        
        // Calculate average rating
        const ratings = venue.reviews.map(r => r.rating);
        const averageRating = ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
        
        // Get sport types and price range
        const sportTypes = [...new Set(venue.courts.map(c => c.sportType))];
        const prices = venue.courts.map(c => c.pricePerHour);
        const priceRange = prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : null;
        
        // Flatten amenities
        const amenities = venue.amenities.map(a => a.amenity);
        
        return {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          city: venue.city,
          latitude: venue.latitude,
          longitude: venue.longitude,
          thumbnail: venue.photos[0]?.url || null,
          sportTypes,
          priceRange,
          averageRating,
          reviewCount: venue._count.reviews,
          amenities,
          distance,
          // Include distance display text for UI
          distanceText: formatDistance(distance)
        };
      })
      // Filter by radius
      .filter(venue => venue.distance <= radius)
      // Sort by distance
      .sort((a, b) => a.distance - b.distance)
      // Apply limit
      .slice(0, limit);
    
    // ========================================
    // STEP 5: BUILD RESPONSE
    // ========================================
    return NextResponse.json({
      success: true,
      data: {
        venues: venuesWithDistance,
        search: {
          latitude,
          longitude,
          radius,
          sportType: sportType || null
        },
        count: venuesWithDistance.length,
        message: venuesWithDistance.length === 0 
          ? `No venues found within ${radius}km. Try increasing the radius.`
          : null
      }
    });
    
  } catch (error) {
    console.error('Nearby venues error:', error);
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
 * HAVERSINE FORMULA
 * Calculates the great-circle distance between two points
 * on the Earth's surface.
 * 
 * @param {number} lat1 - User's latitude
 * @param {number} lon1 - User's longitude
 * @param {number} lat2 - Venue's latitude
 * @param {number} lon2 - Venue's longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c * 10) / 10;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * FORMAT DISTANCE FOR UI
 * Converts distance to user-friendly text
 * 
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance
 */
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  } else if (km < 10) {
    return `${km.toFixed(1)}km away`;
  } else {
    return `${Math.round(km)}km away`;
  }
}
