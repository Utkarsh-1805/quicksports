import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/admin';
import { adminVenueQuerySchema } from '../../../../validations/admin.validation';

// GET /api/admin/venues - List all venues for admin review
export async function GET(request) {
  try {
    // Check admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const url = new URL(request.url);
    
    // Validate and sanitize query parameters
    const queryValidation = adminVenueQuerySchema.safeParse({
      status: url.searchParams.get('status'),
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      search: url.searchParams.get('search'),
      city: url.searchParams.get('city'),
      ownerId: url.searchParams.get('ownerId')
    });
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: queryValidation.error.issues
        },
        { status: 400 }
      );
    }
    
    const { status, page, limit, search, city, ownerId } = queryValidation.data;
    const skip = (page - 1) * limit;

    // Build filter with sanitized parameters
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (ownerId) where.ownerId = ownerId;

    // Get venues with owner details
    const venues = await prisma.facility.findMany({
      where,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        courts: {
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true
          }
        },
        _count: {
          select: {
            courts: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalCount = await prisma.facility.count({ where });

    // Format response
    const formattedVenues = venues.map(venue => ({
      id: venue.id,
      name: venue.name,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      status: venue.status,
      adminNote: venue.adminNote,
      approvedAt: venue.approvedAt,
      approvedBy: venue.approvedBy,
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
      owner: venue.owner,
      courts: venue.courts,
      stats: {
        totalCourts: venue._count.courts,
        totalReviews: venue._count.reviews
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        venues: formattedVenues,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin get venues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}