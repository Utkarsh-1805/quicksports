import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/admin';
import { adminVenueStatusUpdateSchema } from '../../../../../validations/admin.validation';

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

// PUT /api/admin/venues/[id] - Update venue status (approve/reject)
export async function PUT(request, { params }) {
  try {
    // Check admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    const { id } = await params;
    const body = await request.json();

    // Validate request body using centralized validation
    const validationResult = adminVenueStatusUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { action, adminNote } = validationResult.data;

    // Check if venue exists and is in pending status
    const venue = await prisma.facility.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            email: true
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

    if (venue.status === 'PENDING') {
      // Fresh review - no previous decision
      console.log(`Admin reviewing pending venue: ${venue.name}`);
    } else {
      // Re-review - changing previous decision
      console.log(`Admin re-reviewing ${venue.status.toLowerCase()} venue: ${venue.name}`);
    }

    // Determine new status based on action
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update venue status
    const updatedVenue = await prisma.facility.update({
      where: { id },
      data: {
        status: newStatus,
        adminNote: adminNote,
        approvedAt: new Date(),
        approvedBy: admin.id,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        courts: {
          select: {
            id: true,
            name: true,
            sportType: true
          }
        }
      }
    });

    // Log admin action with previous status context
    const actionType = venue.status === 'PENDING' ? action : `re-${action}`;
    console.log(`Admin ${admin.name} ${actionType}d venue "${venue.name}" (ID: ${id})`);
    console.log(`Previous status: ${venue.status} -> New status: ${newStatus}`);
    console.log(`Reason: ${adminNote}`);

    return NextResponse.json({
      success: true,
      message: venue.status === 'PENDING' 
        ? `Venue ${action}d successfully`
        : `Venue ${action}d successfully (was ${venue.status.toLowerCase()})`,
      data: {
        venue: {
          id: updatedVenue.id,
          name: updatedVenue.name,
          status: updatedVenue.status,
          adminNote: updatedVenue.adminNote,
          approvedAt: updatedVenue.approvedAt,
          approvedBy: updatedVenue.approvedBy,
          owner: updatedVenue.owner,
          courts: updatedVenue.courts
        },
        adminAction: {
          action: action,
          previousStatus: venue.status,
          newStatus: newStatus,
          adminName: admin.name,
          adminId: admin.id,
          note: adminNote,
          timestamp: updatedVenue.approvedAt,
          isReReview: venue.status !== 'PENDING'
        }
      }
    });

  } catch (error) {
    console.error(`Admin venue ${body?.action || 'update'} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update venue status' },
      { status: 500 }
    );
  }
}