/**
 * ADMIN MODERATION ACTION API
 * ===========================
 * 
 * GET /api/admin/moderation/[id] - Get specific report details
 * PUT /api/admin/moderation/[id] - Take action on a report
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import prisma from "../../../../../lib/prisma";
import { z } from "zod";

const moderationActionSchema = z.object({
  action: z.enum(['investigate', 'resolve', 'dismiss', 'escalate']),
  resolution: z.string().min(5).max(1000).optional(),
  
  // Moderation actions
  banUser: z.boolean().optional(),
  banDuration: z.number().min(1).max(365).optional(), // days
  removeContent: z.boolean().optional(),
  suspendVenue: z.boolean().optional(),
  refundBooking: z.boolean().optional(),
  
  // Internal notes
  adminNotes: z.string().max(500).optional()
});

/**
 * GET /api/admin/moderation/[id]
 * 
 * Get detailed information about a specific report
 */
export async function GET(request, { params }) {
  try {
    // ==========================================
    // STEP 1: Verify Admin Access
    // ==========================================
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const { id } = await params;

    // ==========================================
    // STEP 2: Get Report with Full Details
    // ==========================================
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: { reports: true }
            }
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    // ==========================================
    // STEP 3: Get Target Details
    // ==========================================
    let targetDetails = null;
    let relatedData = null;

    switch (report.targetType) {
      case 'FACILITY':
        targetDetails = await prisma.facility.findUnique({
          where: { id: report.targetId },
          include: {
            owner: { select: { name: true, email: true, phone: true } },
            courts: { select: { name: true, sportType: true, isActive: true } },
            reviews: { 
              select: { rating: true, isFlagged: true },
              take: 5,
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: { 
                bookings: true,
                reviews: true
              }
            }
          }
        });
        
        // Get other reports for this facility
        relatedData = await prisma.report.findMany({
          where: { 
            targetType: 'FACILITY',
            targetId: report.targetId,
            id: { not: report.id }
          },
          select: { id: true, category: true, status: true, createdAt: true }
        });
        break;

      case 'USER':
        targetDetails = await prisma.user.findUnique({
          where: { id: report.targetId },
          include: {
            bookings: { 
              select: { status: true, createdAt: true },
              take: 10,
              orderBy: { createdAt: 'desc' }
            },
            reviews: {
              select: { rating: true, isFlagged: true, createdAt: true },
              take: 5,
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
                reports: true
              }
            }
          }
        });

        // Get other reports about this user
        relatedData = await prisma.report.findMany({
          where: {
            targetType: 'USER',
            targetId: report.targetId,
            id: { not: report.id }
          },
          select: { id: true, category: true, status: true, createdAt: true }
        });
        break;

      case 'BOOKING':
        targetDetails = await prisma.booking.findUnique({
          where: { id: report.targetId },
          include: {
            user: { select: { name: true, email: true } },
            court: {
              include: {
                facility: {
                  select: { name: true, owner: { select: { name: true, email: true } } }
                }
              }
            },
            payment: { select: { status: true, totalAmount: true } }
          }
        });
        break;

      case 'REVIEW':
        targetDetails = await prisma.review.findUnique({
          where: { id: report.targetId },
          include: {
            user: { select: { name: true, email: true } },
            facility: { 
              select: { 
                name: true,
                owner: { select: { name: true, email: true } }
              }
            }
          }
        });
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        targetDetails,
        relatedReports: relatedData
      }
    });

  } catch (error) {
    console.error('Get report details error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get report details' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/moderation/[id]
 * 
 * Take moderation action on a report
 */
export async function PUT(request, { params }) {
  try {
    // ==========================================
    // STEP 1: Verify Admin Access
    // ==========================================
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    const { id } = await params;

    // ==========================================
    // STEP 2: Validate Request Body
    // ==========================================
    const body = await request.json();
    
    const validation = moderationActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { 
      action, 
      resolution, 
      banUser, 
      banDuration, 
      removeContent, 
      suspendVenue,
      refundBooking,
      adminNotes 
    } = validation.data;

    // ==========================================
    // STEP 3: Get Report
    // ==========================================
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true } }
      }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    // ==========================================
    // STEP 4: Execute Moderation Actions
    // ==========================================
    const actions = [];

    if (banUser && report.targetType === 'USER') {
      const banUntil = banDuration 
        ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)
        : null;
        
      await prisma.user.update({
        where: { id: report.targetId },
        data: { 
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: `Banned due to report: ${report.title}`
        }
      });
      
      actions.push(`User banned${banDuration ? ` for ${banDuration} days` : ' indefinitely'}`);
    }

    if (suspendVenue && report.targetType === 'FACILITY') {
      await prisma.facility.update({
        where: { id: report.targetId },
        data: { status: 'SUSPENDED' }
      });
      
      actions.push('Venue suspended');
    }

    if (removeContent && report.targetType === 'REVIEW') {
      await prisma.review.update({
        where: { id: report.targetId },
        data: { 
          isFlagged: true,
          isApproved: false
        }
      });
      
      actions.push('Review flagged and hidden');
    }

    if (refundBooking && report.targetType === 'BOOKING') {
      // This would integrate with your existing refund system
      actions.push('Booking marked for refund (manual processing required)');
    }

    // ==========================================
    // STEP 5: Update Report Status
    // ==========================================
    const newStatus = action === 'resolve' ? 'RESOLVED' : 
                      action === 'dismiss' ? 'DISMISSED' : 
                      action === 'investigate' ? 'INVESTIGATING' : 'PENDING';

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: newStatus,
        resolution: resolution || null,
        resolvedAt: (action === 'resolve' || action === 'dismiss') ? new Date() : null,
        resolvedBy: admin.id,
        metadata: {
          ...report.metadata,
          adminActions: actions,
          adminNotes: adminNotes,
          actionTakenAt: new Date().toISOString(),
          actionTakenBy: admin.name
        }
      }
    });

    // ==========================================
    // STEP 6: Create Admin Activity Log
    // ==========================================
    // In a production system, you might want to log admin actions

    return NextResponse.json({
      success: true,
      message: `Report ${action}d successfully`,
      data: {
        report: updatedReport,
        actionsTaken: actions
      }
    });

  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}