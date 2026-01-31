import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/admin';

// GET /api/admin/venues/[id] - Get venue details for admin review
export async function GET(request, { params }) {
  try {
    // Check admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const { id } = await params;

    const venue = await prisma.facility.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            isVerified: true
          }
        },
        courts: {
          include: {
            _count: {
              select: {
                bookings: true,
                timeSlots: true
              }
            }
          }
        },
        amenities: {
          include: {
            amenity: true
          }
        },
        photos: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            courts: true,
            reviews: true
          }
        }
      }
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Venue details retrieved successfully',
      data: { venue }
    });

  } catch (error) {
    console.error('Admin get venue details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue details' },
      { status: 500 }
    );
  }
}