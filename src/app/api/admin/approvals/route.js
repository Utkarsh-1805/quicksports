/**
 * ADMIN FACILITY APPROVAL API
 * ===========================
 * 
 * GET /api/admin/approvals - List pending facility approvals
 * 
 * Provides a dedicated endpoint for managing venue approvals:
 * - List all pending venues
 * - Quick stats on approval queue
 * - Prioritized by submission date
 * 
 * @module api/admin/approvals
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";
import { adminVenueStatusUpdateSchema } from "../../../../validations/admin.validation";

/**
 * GET /api/admin/approvals - Get pending facility approvals
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - priority: 'oldest' | 'newest' (default: 'oldest')
 * 
 * @requires Admin Authentication
 */
export async function GET(request) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const priority = searchParams.get('priority') || 'oldest';
    const skip = (page - 1) * limit;

    // Fetch pending venues
    const [pendingVenues, totalPending, allStats] = await Promise.all([
      prisma.facility.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: priority === 'oldest' ? 'asc' : 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isVerified: true,
              createdAt: true,
              _count: {
                select: { facilities: true }
              }
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
          amenities: {
            include: {
              amenity: {
                select: { name: true, icon: true }
              }
            }
          },
          photos: {
            select: { url: true, caption: true },
            take: 5
          }
        }
      }),
      prisma.facility.count({ where: { status: 'PENDING' } }),
      prisma.facility.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    // Calculate stats
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    allStats.forEach(s => {
      stats[s.status.toLowerCase()] = s._count.status;
    });

    // Calculate average wait time for pending venues
    let avgWaitDays = 0;
    if (pendingVenues.length > 0) {
      const now = new Date();
      const totalDays = pendingVenues.reduce((sum, venue) => {
        const days = Math.floor((now - new Date(venue.createdAt)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgWaitDays = Math.round(totalDays / pendingVenues.length);
    }

    // Format venues for response
    const formattedVenues = pendingVenues.map(venue => ({
      id: venue.id,
      name: venue.name,
      description: venue.description,
      status: venue.status, // Include status field
      address: venue.address,
      city: venue.city,
      state: venue.state,
      pincode: venue.pincode,
      latitude: venue.latitude,
      longitude: venue.longitude,
      createdAt: venue.createdAt, // Keep as createdAt for date formatting
      submittedAt: venue.createdAt,
      waitingDays: Math.floor((new Date() - new Date(venue.createdAt)) / (1000 * 60 * 60 * 24)),
      
      owner: {
        ...venue.owner,
        totalFacilities: venue.owner._count.facilities
      },
      
      courts: venue.courts,
      courtsCount: venue.courts.length,
      _count: { courts: venue.courts.length }, // Add _count for component compatibility
      
      amenities: venue.amenities.map(a => ({
        name: a.amenity.name,
        icon: a.amenity.icon
      })),
      
      photos: venue.photos.map(p => p.url), // Extract URLs for component
      photosCount: venue.photos.length,
      
      // Quick review indicators
      flags: {
        hasPhotos: venue.photos.length > 0,
        hasCourts: venue.courts.length > 0,
        hasAmenities: venue.amenities.length > 0,
        ownerVerified: venue.owner.isVerified,
        isFirstVenue: venue.owner._count.facilities === 1
      }
    }));

    return NextResponse.json({
      success: true,
      message: 'Pending approvals retrieved',
      data: {
        venues: formattedVenues,
        pagination: {
          page,
          limit,
          total: totalPending,
          pages: Math.ceil(totalPending / limit)
        },
        stats: {
          ...stats,
          avgWaitDays
        },
        actions: {
          approve: 'PUT /api/admin/venues/{id} with { "action": "approve" }',
          reject: 'PUT /api/admin/venues/{id} with { "action": "reject", "adminNote": "reason" }'
        }
      }
    });

  } catch (error) {
    console.error('Get approvals error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/approvals - Process venue approval/rejection
 * 
 * Body:
 * - venueId: string (required) - ID of the venue to approve/reject
 * - action: "approve" | "reject" (required)
 * - adminNote: string (required) - Admin's reason/note
 * - autoNotify: boolean (optional) - Whether to send notification to owner
 * 
 * @requires Admin Authentication
 */
export async function POST(request) {
  try {
    // ==========================================
    // STEP 1: Verify Admin Access
    // ==========================================
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    
    // ==========================================
    // STEP 2: Parse and Validate Request Body
    // ==========================================
    const body = await request.json();
    
    // Validate venueId
    if (!body.venueId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Venue ID is required',
          details: 'Please provide a valid venueId in the request body'
        },
        { status: 400 }
      );
    }

    // Validate approval data using existing schema
    const validationResult = adminVenueStatusUpdateSchema.safeParse({
      action: body.action,
      adminNote: body.adminNote,
      autoNotify: body.autoNotify
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            received: issue.received
          }))
        },
        { status: 400 }
      );
    }

    const { action, adminNote, autoNotify } = validationResult.data;

    // ==========================================
    // STEP 3: Verify Venue Exists
    // ==========================================
    const venue = await prisma.facility.findUnique({
      where: { id: body.venueId },
      include: {
        owner: {
          select: {
            id: true,
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

    if (!venue) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Venue not found',
          details: `No venue found with ID: ${body.venueId}`
        },
        { status: 404 }
      );
    }

    // ==========================================
    // STEP 4: Process Approval/Rejection
    // ==========================================
    const previousStatus = venue.status;
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const timestamp = new Date();

    // Update venue status
    const updatedVenue = await prisma.facility.update({
      where: { id: body.venueId },
      data: {
        status: newStatus,
        adminNote: adminNote,
        approvedAt: timestamp,
        approvedBy: admin.id,
        updatedAt: timestamp
      },
      include: {
        owner: {
          select: {
            id: true,
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

    // ==========================================
    // STEP 5: Create Admin Activity Log
    // ==========================================
    const isReReview = previousStatus !== 'PENDING';
    const actionType = isReReview ? `re-${action}` : action;
    
    console.log(`Admin ${admin.name} ${actionType}d venue "${venue.name}" (ID: ${body.venueId})`);
    console.log(`Previous status: ${previousStatus} -> New status: ${newStatus}`);
    console.log(`Reason: ${adminNote}`);

    // ==========================================
    // STEP 6: Send Response
    // ==========================================
    return NextResponse.json({
      success: true,
      message: isReReview 
        ? `Venue ${action}d successfully (was ${previousStatus.toLowerCase()})`
        : `Venue ${action}d successfully`,
      data: {
        venue: {
          id: updatedVenue.id,
          name: updatedVenue.name,
          status: updatedVenue.status,
          previousStatus: previousStatus,
          adminNote: updatedVenue.adminNote,
          approvedAt: updatedVenue.approvedAt,
          approvedBy: updatedVenue.approvedBy,
          owner: updatedVenue.owner,
          courts: updatedVenue.courts
        },
        adminAction: {
          action: action,
          actionType: actionType,
          adminName: admin.name,
          adminId: admin.id,
          note: adminNote,
          timestamp: timestamp,
          isReReview: isReReview,
          autoNotify: autoNotify
        },
        stats: {
          totalCourts: updatedVenue.courts.length,
          sportTypes: [...new Set(updatedVenue.courts.map(court => court.sportType))],
          processedBy: {
            id: admin.id,
            name: admin.name,
            role: admin.role
          }
        }
      }
    });

  } catch (error) {
    console.error('Process approval error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process venue approval',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
