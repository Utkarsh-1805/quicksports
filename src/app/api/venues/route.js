import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/auth";

// GET /api/venues - Get all approved venues with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sportType = searchParams.get('sportType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
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
      take: limit,
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
        const minFacilityPrice = Math.min(...prices);
        const maxFacilityPrice = Math.max(...prices);
        
        if (minPrice && maxPrice) {
          return minFacilityPrice >= parseFloat(minPrice) && maxFacilityPrice <= parseFloat(maxPrice);
        } else if (minPrice) {
          return minFacilityPrice >= parseFloat(minPrice);
        } else if (maxPrice) {
          return maxFacilityPrice <= parseFloat(maxPrice);
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
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
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
    const {
      name,
      description,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude
    } = body;
    
    // Validate required fields
    if (!name || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, message: 'Name, address, city, state, and pincode are required' },
        { status: 400 }
      );
    }
    
    const facility = await prisma.facility.create({
      data: {
        name,
        description,
        address,
        city,
        state,
        pincode,
        latitude,
        longitude,
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