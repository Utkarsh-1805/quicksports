/**
 * Search & Discovery Service
 * Centralized service for advanced search, filtering, and venue discovery
 */

import { prisma } from "../lib/prisma";

// ==================== CONSTANTS ====================

const SPORT_TYPES = [
  'BADMINTON', 'TENNIS', 'BASKETBALL', 'FOOTBALL', 
  'TABLE_TENNIS', 'SWIMMING', 'CRICKET', 'VOLLEYBALL', 'SQUASH', 'OTHER'
];

// ==================== HAVERSINE DISTANCE ====================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ==================== TRENDING & POPULAR ====================

/**
 * Get trending venues based on recent activity
 */
export async function getTrendingVenues(options = {}) {
  const { limit = 10, sportType, city } = options;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get venues with most bookings in last 30 days
  const venuesWithBookings = await prisma.facility.findMany({
    where: {
      status: 'APPROVED',
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(sportType && { 
        courts: { some: { sportType, isActive: true } }
      })
    },
    include: {
      courts: {
        where: { isActive: true },
        include: {
          bookings: {
            where: {
              createdAt: { gte: thirtyDaysAgo },
              status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
          }
        }
      },
      reviews: {
        where: { isApproved: true },
        select: { rating: true }
      },
      amenities: {
        include: { amenity: true }
      },
      photos: { take: 1 }
    }
  });

  // Calculate trending score
  const venuesWithScores = venuesWithBookings.map(venue => {
    const totalBookings = venue.courts.reduce(
      (sum, court) => sum + court.bookings.length, 0
    );
    
    const avgRating = venue.reviews.length > 0
      ? venue.reviews.reduce((sum, r) => sum + r.rating, 0) / venue.reviews.length
      : 0;
    
    const minPrice = venue.courts.length > 0
      ? Math.min(...venue.courts.map(c => c.pricePerHour))
      : 0;

    // Trending score: weighted combination of bookings and rating
    const trendingScore = (totalBookings * 2) + (avgRating * 10);

    return {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      address: venue.address,
      photo: venue.photos[0]?.url || null,
      rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      reviewCount: venue.reviews.length,
      bookingsThisMonth: totalBookings,
      minPrice,
      sports: [...new Set(venue.courts.map(c => c.sportType))],
      amenities: venue.amenities.map(a => a.amenity.name),
      trendingScore
    };
  });

  // Sort by trending score and limit
  return venuesWithScores
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
}

/**
 * Get popular sports in a city or overall
 */
export async function getPopularSports(city = null) {
  const where = {
    isActive: true,
    facility: {
      status: 'APPROVED',
      ...(city && { city: { contains: city, mode: 'insensitive' } })
    }
  };

  const sportCounts = await prisma.court.groupBy({
    by: ['sportType'],
    where,
    _count: { id: true }
  });

  // Get booking counts per sport
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const sportsWithBookings = await Promise.all(
    sportCounts.map(async (sport) => {
      const bookingCount = await prisma.booking.count({
        where: {
          court: {
            sportType: sport.sportType,
            isActive: true,
            facility: { 
              status: 'APPROVED',
              ...(city && { city: { contains: city, mode: 'insensitive' } })
            }
          },
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      });

      return {
        sport: sport.sportType,
        courtCount: sport._count.id,
        bookingsThisMonth: bookingCount,
        popularityScore: sport._count.id + (bookingCount * 2)
      };
    })
  );

  return sportsWithBookings.sort((a, b) => b.popularityScore - a.popularityScore);
}

/**
 * Get featured cities with venue counts
 */
export async function getFeaturedCities(limit = 10) {
  const cityCounts = await prisma.facility.groupBy({
    by: ['city'],
    where: { status: 'APPROVED' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  // Get additional details for each city
  const citiesWithDetails = await Promise.all(
    cityCounts.map(async (cityData) => {
      const venueCount = cityData._count.id;
      
      // Get sport types available in this city
      const sports = await prisma.court.findMany({
        where: {
          isActive: true,
          facility: {
            status: 'APPROVED',
            city: cityData.city
          }
        },
        select: { sportType: true },
        distinct: ['sportType']
      });

      // Get average price range
      const priceStats = await prisma.court.aggregate({
        where: {
          isActive: true,
          facility: {
            status: 'APPROVED',
            city: cityData.city
          }
        },
        _min: { pricePerHour: true },
        _max: { pricePerHour: true },
        _avg: { pricePerHour: true }
      });

      return {
        city: cityData.city,
        venueCount,
        sportsAvailable: sports.map(s => s.sportType),
        priceRange: {
          min: priceStats._min.pricePerHour || 0,
          max: priceStats._max.pricePerHour || 0,
          avg: priceStats._avg.pricePerHour 
            ? parseFloat(priceStats._avg.pricePerHour.toFixed(0))
            : 0
        }
      };
    })
  );

  return citiesWithDetails;
}

// ==================== AVAILABILITY SEARCH ====================

/**
 * Search venues with availability on a specific date/time
 */
export async function searchWithAvailability(options = {}) {
  const {
    date,
    startTime,
    endTime,
    sportType,
    city,
    latitude,
    longitude,
    radius = 10,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10
  } = options;

  const skip = (page - 1) * limit;

  // Build base where clause
  const where = {
    status: 'APPROVED',
    courts: {
      some: {
        isActive: true,
        ...(sportType && { sportType }),
        ...(minPrice !== undefined && { pricePerHour: { gte: minPrice } }),
        ...(maxPrice !== undefined && { pricePerHour: { lte: maxPrice } })
      }
    },
    ...(city && { city: { contains: city, mode: 'insensitive' } })
  };

  // Fetch venues
  const venues = await prisma.facility.findMany({
    where,
    include: {
      courts: {
        where: {
          isActive: true,
          ...(sportType && { sportType })
        },
        include: {
          timeSlots: date ? {
            where: {
              date: new Date(date),
              isBlocked: false,
              booking: null
            }
          } : undefined
        }
      },
      reviews: {
        where: { isApproved: true },
        select: { rating: true }
      },
      photos: { take: 1 },
      amenities: {
        include: { amenity: true }
      }
    }
  });

  // Process venues
  let processedVenues = venues.map(venue => {
    // Calculate rating
    const avgRating = venue.reviews.length > 0
      ? venue.reviews.reduce((sum, r) => sum + r.rating, 0) / venue.reviews.length
      : null;

    // Calculate distance if coordinates provided
    let distance = null;
    if (latitude && longitude && venue.latitude && venue.longitude) {
      distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
    }

    // Get available courts for the date
    const availableCourts = date
      ? venue.courts.filter(court => court.timeSlots.length > 0)
      : venue.courts;

    // Filter by time if provided
    let matchingSlots = [];
    if (date && startTime) {
      matchingSlots = availableCourts.flatMap(court =>
        court.timeSlots.filter(slot => {
          if (startTime && slot.startTime < startTime) return false;
          if (endTime && slot.endTime > endTime) return false;
          return true;
        }).map(slot => ({
          courtId: court.id,
          courtName: court.name,
          sportType: court.sportType,
          price: court.pricePerHour,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      );
    }

    const minPrice = venue.courts.length > 0
      ? Math.min(...venue.courts.map(c => c.pricePerHour))
      : 0;

    return {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      address: venue.address,
      latitude: venue.latitude,
      longitude: venue.longitude,
      photo: venue.photos[0]?.url || null,
      rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      reviewCount: venue.reviews.length,
      distance: distance ? parseFloat(distance.toFixed(1)) : null,
      minPrice,
      sports: [...new Set(venue.courts.map(c => c.sportType))],
      amenities: venue.amenities.map(a => a.amenity.name),
      courtCount: venue.courts.length,
      availableCourts: availableCourts.length,
      matchingSlots: matchingSlots.slice(0, 5), // Top 5 matching slots
      hasAvailability: date ? availableCourts.length > 0 : true
    };
  });

  // Filter by radius if location provided
  if (latitude && longitude && radius) {
    processedVenues = processedVenues.filter(v => 
      v.distance !== null && v.distance <= radius
    );
  }

  // Filter by availability if date provided
  if (date) {
    processedVenues = processedVenues.filter(v => v.hasAvailability);
  }

  // Sort by distance if location provided, else by rating
  if (latitude && longitude) {
    processedVenues.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  } else {
    processedVenues.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const total = processedVenues.length;
  const paginatedVenues = processedVenues.slice(skip, skip + limit);

  return {
    venues: paginatedVenues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// ==================== SEARCH ANALYTICS ====================

/**
 * Get search analytics for admin dashboard
 */
export async function getSearchAnalytics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalVenues,
    totalCourts,
    activeCourts,
    venuesByCity,
    sportDistribution,
    priceStats
  ] = await Promise.all([
    prisma.facility.count({ where: { status: 'APPROVED' } }),
    prisma.court.count(),
    prisma.court.count({ where: { isActive: true } }),
    prisma.facility.groupBy({
      by: ['city'],
      where: { status: 'APPROVED' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.court.groupBy({
      by: ['sportType'],
      where: { isActive: true },
      _count: { id: true }
    }),
    prisma.court.aggregate({
      where: { isActive: true },
      _min: { pricePerHour: true },
      _max: { pricePerHour: true },
      _avg: { pricePerHour: true }
    })
  ]);

  return {
    inventory: {
      totalVenues,
      totalCourts,
      activeCourts,
      inactiveCourts: totalCourts - activeCourts
    },
    geography: {
      topCities: venuesByCity.map(c => ({
        city: c.city,
        venueCount: c._count.id
      }))
    },
    sports: sportDistribution.map(s => ({
      sport: s.sportType,
      courtCount: s._count.id
    })),
    pricing: {
      minPrice: priceStats._min.pricePerHour || 0,
      maxPrice: priceStats._max.pricePerHour || 0,
      avgPrice: priceStats._avg.pricePerHour 
        ? parseFloat(priceStats._avg.pricePerHour.toFixed(0))
        : 0
    }
  };
}

// ==================== FILTERS METADATA ====================

/**
 * Get available filter options for search UI
 */
export async function getFilterOptions(city = null) {
  const cityFilter = city ? { city: { contains: city, mode: 'insensitive' } } : {};

  const [
    cities,
    sports,
    amenities,
    priceRange
  ] = await Promise.all([
    // Available cities
    prisma.facility.findMany({
      where: { status: 'APPROVED' },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' }
    }),
    
    // Available sports in selected city or all
    prisma.court.findMany({
      where: {
        isActive: true,
        facility: { 
          status: 'APPROVED',
          ...cityFilter
        }
      },
      select: { sportType: true },
      distinct: ['sportType']
    }),
    
    // Available amenities
    prisma.amenity.findMany({
      orderBy: { name: 'asc' }
    }),
    
    // Price range
    prisma.court.aggregate({
      where: {
        isActive: true,
        facility: { 
          status: 'APPROVED',
          ...cityFilter
        }
      },
      _min: { pricePerHour: true },
      _max: { pricePerHour: true }
    })
  ]);

  return {
    cities: cities.map(c => c.city),
    sports: sports.map(s => s.sportType),
    amenities: amenities.map(a => ({
      id: a.id,
      name: a.name,
      icon: a.icon
    })),
    priceRange: {
      min: priceRange._min.pricePerHour || 0,
      max: priceRange._max.pricePerHour || 1000
    }
  };
}

// ==================== SIMILAR VENUES ====================

/**
 * Get venues similar to a given venue
 */
export async function getSimilarVenues(venueId, limit = 5) {
  // Get the reference venue
  const venue = await prisma.facility.findUnique({
    where: { id: venueId },
    include: {
      courts: { select: { sportType: true } },
      amenities: { select: { amenityId: true } }
    }
  });

  if (!venue) return [];

  const venueSports = venue.courts.map(c => c.sportType);
  const venueAmenities = venue.amenities.map(a => a.amenityId);

  // Find venues with similar sports in same city
  const similarVenues = await prisma.facility.findMany({
    where: {
      id: { not: venueId },
      status: 'APPROVED',
      city: venue.city,
      courts: {
        some: {
          sportType: { in: venueSports },
          isActive: true
        }
      }
    },
    include: {
      courts: {
        where: { isActive: true },
        select: {
          sportType: true,
          pricePerHour: true
        }
      },
      reviews: {
        where: { isApproved: true },
        select: { rating: true }
      },
      photos: { take: 1 },
      amenities: {
        include: { amenity: true }
      }
    },
    take: limit * 2 // Get more to score and filter
  });

  // Score venues by similarity
  const scoredVenues = similarVenues.map(v => {
    const commonSports = v.courts.filter(c => venueSports.includes(c.sportType)).length;
    const commonAmenities = v.amenities.filter(a => venueAmenities.includes(a.amenityId)).length;
    const avgRating = v.reviews.length > 0
      ? v.reviews.reduce((sum, r) => sum + r.rating, 0) / v.reviews.length
      : 0;
    
    const similarityScore = (commonSports * 3) + (commonAmenities * 2) + avgRating;

    const minPrice = v.courts.length > 0
      ? Math.min(...v.courts.map(c => c.pricePerHour))
      : 0;

    return {
      id: v.id,
      name: v.name,
      city: v.city,
      photo: v.photos[0]?.url || null,
      rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
      reviewCount: v.reviews.length,
      minPrice,
      sports: [...new Set(v.courts.map(c => c.sportType))],
      amenities: v.amenities.map(a => a.amenity.name),
      similarityScore
    };
  });

  return scoredVenues
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}
