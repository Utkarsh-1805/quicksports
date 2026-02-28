/**
 * FAVORITES API
 * =============
 * 
 * GET    /api/favorites - Get user's favorite venues
 * POST   /api/favorites - Add venue to favorites
 * DELETE /api/favorites?venueId=xxx - Remove from favorites
 */

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyAuth } from '../../../lib/auth';

/**
 * GET /api/favorites - Get user's favorite venues
 */
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Get favorites with venue details
    const favorites = await prisma.favorite.findMany({
      where: { userId: userId },
      include: {
        facility: {
          include: {
            photos: { take: 1 },
            courts: {
              select: {
                sportType: true,
                pricePerHour: true
              }
            },
            reviews: {
              select: { rating: true }
            },
            _count: {
              select: { reviews: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response
    const formattedFavorites = favorites.map(fav => {
      const facility = fav.facility;
      const avgRating = facility.reviews.length > 0
        ? facility.reviews.reduce((sum, r) => sum + r.rating, 0) / facility.reviews.length
        : 0;
      const minPrice = facility.courts.length > 0
        ? Math.min(...facility.courts.map(c => c.pricePerHour))
        : 0;
      const sportTypes = [...new Set(facility.courts.map(c => c.sportType))];

      return {
        id: fav.id,
        addedAt: fav.createdAt,
        venue: {
          id: facility.id,
          name: facility.name,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          image: facility.photos[0]?.url || null,
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: facility._count.reviews,
          minPrice,
          sportTypes,
          status: facility.status
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        favorites: formattedFavorites,
        count: formattedFavorites.length
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites - Add venue to favorites
 */
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    const body = await request.json();
    const { venueId } = body;

    if (!venueId) {
      return NextResponse.json(
        { success: false, error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Check if venue exists
    const venue = await prisma.facility.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return NextResponse.json(
        { success: false, error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_facilityId: {
          userId: userId,
          facilityId: venueId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Venue already in favorites' },
        { status: 409 }
      );
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: userId,
        facilityId: venueId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Added to favorites',
      data: { favoriteId: favorite.id }
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites - Remove from favorites
 */
export async function DELETE(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');

    if (!venueId) {
      return NextResponse.json(
        { success: false, error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    // Remove from favorites
    await prisma.favorite.deleteMany({
      where: {
        userId: userId,
        facilityId: venueId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
