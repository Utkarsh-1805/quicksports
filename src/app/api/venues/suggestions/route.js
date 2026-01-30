import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateSuggestionsParams } from "../../../../validations/search.validation";

/**
 * ============================================
 * SEARCH SUGGESTIONS API (Autocomplete)
 * ============================================
 * 
 * GET /api/venues/suggestions
 * 
 * This API provides autocomplete suggestions for the search bar.
 * 
 * FEATURES:
 * 1. Venue name suggestions
 * 2. City suggestions
 * 3. Sport type suggestions
 * 4. Combined search results
 * 
 * USE CASE:
 * - User types "Bad" in search bar
 * - API returns:
 *   - Venues: "Badminton Arena", "Badminton Hub"
 *   - Cities: "Badaun", "Baddi"
 *   - Sports: "BADMINTON"
 * 
 * QUERY PARAMS:
 * - query: Search term (min 2 chars)
 * - type: Filter by type (venues, cities, sports, all)
 * - limit: Max results per category (default: 5)
 * 
 * EXAMPLE:
 * /api/venues/suggestions?query=del&type=all&limit=5
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ========================================
    // STEP 1: VALIDATE INPUT
    // ========================================
    const validation = validateSuggestionsParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const { query, type, limit } = validation.data;
    
    const suggestions = {
      venues: [],
      cities: [],
      sports: []
    };
    
    // ========================================
    // STEP 2: VENUE NAME SUGGESTIONS
    // ========================================
    /**
     * LOGIC:
     * - Search for venues whose name contains the query
     * - Only return APPROVED venues
     * - Return id, name, and city for each match
     * - Limit results to prevent overload
     * 
     * Use case: User types "Sport" → Shows "Sports Arena", "Sportify Hub"
     */
    if (type === 'all' || type === 'venues') {
      const venues = await prisma.facility.findMany({
        where: {
          status: 'APPROVED',
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          city: true
        },
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });
      
      suggestions.venues = venues.map(v => ({
        id: v.id,
        name: v.name,
        city: v.city,
        type: 'venue'
      }));
    }
    
    // ========================================
    // STEP 3: CITY SUGGESTIONS
    // ========================================
    /**
     * LOGIC:
     * - Get distinct cities from approved venues
     * - Filter cities that contain the search query
     * - Use groupBy for unique values
     * 
     * Use case: User types "Del" → Shows "Delhi", "Dehradun"
     * 
     * NOTE: Prisma's groupBy with having filter
     * We need to fetch all cities and filter in JS because
     * Prisma doesn't support HAVING with LIKE on grouped fields
     */
    if (type === 'all' || type === 'cities') {
      const allCities = await prisma.facility.findMany({
        where: {
          status: 'APPROVED',
          city: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          city: true
        },
        distinct: ['city'],
        take: limit,
        orderBy: {
          city: 'asc'
        }
      });
      
      suggestions.cities = allCities.map(c => ({
        name: c.city,
        type: 'city'
      }));
    }
    
    // ========================================
    // STEP 4: SPORT TYPE SUGGESTIONS
    // ========================================
    /**
     * LOGIC:
     * - Get sport types from the SportType enum
     * - Filter by query match in JavaScript (since enum doesn't support contains)
     * - Include count of venues offering this sport
     * 
     * Use case: User types "Bad" → Shows "BADMINTON"
     * 
     * NOTE: SportType is an enum in Prisma schema
     * We get all unique sport types from courts table, then filter
     */
    if (type === 'all' || type === 'sports') {
      // Get all unique sport types from active courts first
      const allSportTypes = await prisma.court.findMany({
        where: {
          isActive: true,
          facility: {
            status: 'APPROVED'
          }
        },
        select: {
          sportType: true
        },
        distinct: ['sportType']
      });
      
      // Filter sport types by query (JavaScript filtering since enum doesn't support contains)
      const filteredSportTypes = allSportTypes.filter(({ sportType }) =>
        sportType.toLowerCase().includes(query.toLowerCase())
      );
      
      // Get venue count for each matching sport type
      const sportsWithCount = await Promise.all(
        filteredSportTypes.map(async ({ sportType }) => {
          const count = await prisma.facility.count({
            where: {
              status: 'APPROVED',
              courts: {
                some: {
                  sportType: sportType,
                  isActive: true
                }
              }
            }
          });
          
          return {
            name: sportType,
            venueCount: count,
            type: 'sport'
          };
        })
      );
      
      suggestions.sports = sportsWithCount
        .sort((a, b) => b.venueCount - a.venueCount)
        .slice(0, limit);
    }
    
    // ========================================
    // STEP 5: BUILD RESPONSE
    // ========================================
    /**
     * LOGIC:
     * - If type is 'all', return all categories
     * - Otherwise, return only the requested category
     * - Include total count for UI feedback
     */
    let response;
    if (type === 'all') {
      response = {
        suggestions,
        total: suggestions.venues.length + suggestions.cities.length + suggestions.sports.length
      };
    } else {
      const categoryData = type === 'venues' ? suggestions.venues : 
                          type === 'cities' ? suggestions.cities : 
                          suggestions.sports;
      
      response = {
        suggestions: categoryData,
        total: categoryData.length
      };
    }
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
