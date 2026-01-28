import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/auth";
import { facilityValidation, validateQueryParams, validateRequest } from "../../../validations/facility.validation.js";

// GET /api/venues - Get all approved venues with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and sanitize query parameters
    const queryValidation = validateQueryParams(searchParams, facilityValidation.facilityQuery);
    if (!queryValidation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters', errors: queryValidation.errors },
        { status: 400 }
      );
    }
    
    const { page = 1, limit = 10, sportType, minPrice, maxPrice, city, search } = queryValidation.data;
    
    // Ensure page and limit are valid numbers
    const validPage = Number.isInteger(page) && page > 0 ? page : 1;
    const validLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const skip = (validPage - 1) * validLimit;
    
    // Build filter conditions
    const where = {
      status: 'APPROVED'
    };
    
    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add city filter
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    // Add sport type filter
    if (sportType) {
      where.courts = {
        some: {
          sportType: sportType
        }
      };
    }
    
    const facilities = await prisma.facility.findMany({
      where,
      skip,
      take: validLimit,
      include: {
        owner: {
          select: {
            name: true,
            email: true
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
        _count: {
          select: {
            courts: { where: { isActive: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Filter by price range if specified
    let filteredFacilities = facilities;
    if (minPrice || maxPrice) {
      filteredFacilities = facilities.filter(facility => {
        const prices = facility.courts.map(court => court.pricePerHour);
        
        if (minPrice && maxPrice) {
          // Has at least one court within the price range
          return prices.some(price => price >= minPrice && price <= maxPrice);
        } else if (minPrice) {
          // Has at least one court above minimum price
          return prices.some(price => price >= minPrice);
        } else if (maxPrice) {
          // Has at least one court within budget
          return prices.some(price => price <= maxPrice);
        }
        return true;
      });
    }
    
    // Get total count for pagination
    const totalCount = await prisma.facility.count({ where });
    
    return NextResponse.json({
      success: true,
      data: {
        venues: filteredFacilities,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: totalCount,
          pages: Math.ceil(totalCount / validLimit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get venues error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/venues - Create new venue (Facility Owner only)
export async function POST(request) {
  try {
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    
    if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only facility owners can create venues' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate and sanitize request body
    const validation = validateRequest(body, facilityValidation.createFacility);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const facilityData = validation.data;
    
    const facility = await prisma.facility.create({
      data: {
        ...facilityData,
        ownerId: user.id,
        status: 'PENDING' // Requires admin approval
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Venue created successfully. Pending admin approval.',
      data: { venue: facility }
    });
    
  } catch (error) {
    console.error('Create venue error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}