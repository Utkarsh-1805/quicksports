/**
 * ADMIN COURT BULK UPDATE API
 * ===========================
 * 
 * POST /api/admin/courts/bulk - Bulk update court availability
 * GET  /api/admin/courts - List all courts with filters
 * 
 * Allows admins to:
 * - Bulk enable/disable courts
 * - Bulk update pricing
 * - Bulk block time slots (maintenance)
 * - View all courts across venues
 * 
 * @module api/admin/courts
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const bulkUpdateSchema = z.object({
  courtIds: z.array(z.string()).min(1, 'At least one court ID required'),
  operation: z.enum(['activate', 'deactivate', 'updatePrice', 'blockSlots', 'unblockSlots']),
  
  // General reason for the operation
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be less than 500 characters').optional(),
  
  // For price updates
  pricePerHour: z.number().min(0).optional(),
  priceChangeType: z.enum(['set', 'increase', 'decrease']).optional(),
  priceChangeValue: z.number().optional(),
  
  // For slot blocking
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  blockReason: z.string().max(200).optional(),
  
  // Notification
  notifyOwners: z.boolean().default(false)
});

const courtQuerySchema = z.object({
  page: z.string().transform(v => Math.max(1, parseInt(v) || 1)),
  limit: z.string().transform(v => Math.min(100, Math.max(1, parseInt(v) || 20))),
  venueId: z.string().optional(),
  sportType: z.enum(['BADMINTON', 'TENNIS', 'FOOTBALL', 'CRICKET', 'BASKETBALL', 'TABLE_TENNIS', 'SWIMMING', 'SQUASH', 'VOLLEYBALL', 'OTHER']).optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === undefined ? undefined : v === 'true'),
  search: z.string().max(100).optional()
});

// ==========================================
// GET /api/admin/courts
// ==========================================

/**
 * List all courts with filters
 * 
 * Query Parameters:
 * - page, limit: Pagination
 * - venueId: Filter by venue
 * - sportType: Filter by sport
 * - isActive: Filter by active status
 * - search: Search by court/venue name
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
    const params = Object.fromEntries(searchParams.entries());
    
    const validation = courtQuerySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid parameters', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, venueId, sportType, isActive, search } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (venueId) where.facilityId = venueId;
    if (sportType) where.sportType = sportType;
    if (isActive !== undefined) where.isActive = isActive;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { facility: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Fetch courts
    const [courts, total] = await Promise.all([
      prisma.court.findMany({
        where,
        skip,
        take: limit,
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              city: true,
              status: true,
              owner: {
                select: { name: true, email: true }
              }
            }
          },
          _count: {
            select: {
              bookings: true,
              timeSlots: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.court.count({ where })
    ]);

    // Get stats
    const stats = await prisma.court.groupBy({
      by: ['sportType'],
      _count: { sportType: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Courts retrieved',
      data: {
        courts: courts.map(court => ({
          id: court.id,
          name: court.name,
          sportType: court.sportType,
          pricePerHour: court.pricePerHour,
          isActive: court.isActive,
          openingTime: court.openingTime,
          closingTime: court.closingTime,
          facility: court.facility,
          stats: {
            totalBookings: court._count.bookings,
            totalSlots: court._count.timeSlots
          },
          createdAt: court.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        sportStats: stats.reduce((acc, s) => {
          acc[s.sportType] = s._count.sportType;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get courts error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve courts' },
      { status: 500 }
    );
  }
}

// ==========================================
// POST /api/admin/courts/bulk
// ==========================================

/**
 * Bulk update courts
 * 
 * Actions:
 * - activate: Enable selected courts
 * - deactivate: Disable selected courts
 * - updatePrice: Update pricing for selected courts
 * - blockSlots: Block time slots for maintenance
 * - unblockSlots: Unblock previously blocked slots
 * 
 * @requires Admin Authentication
 */
export async function POST(request) {
  try {
    // Verify admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { success: false, message: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const body = await request.json();
    const validation = bulkUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      const errorDetails = validation.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.received || 'undefined'
      }));

      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: errorDetails,
          validOptions: {
            operation: ['activate', 'deactivate', 'updatePrice', 'blockSlots', 'unblockSlots'],
            reason: 'String with 10-500 characters describing the operation'
          }
        },
        { status: 400 }
      );
    }

    const { 
      courtIds, operation, reason, pricePerHour, priceChangeType, priceChangeValue,
      date, startTime, endTime, blockReason, notifyOwners 
    } = validation.data;

    // Verify courts exist
    const courts = await prisma.court.findMany({
      where: { id: { in: courtIds } },
      select: { id: true, name: true, pricePerHour: true, facilityId: true }
    });

    if (courts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid courts found' },
        { status: 404 }
      );
    }

    let result = { updated: 0, failed: 0, details: [] };

    switch (operation) {
      case 'activate':
        const activateResult = await prisma.court.updateMany({
          where: { id: { in: courtIds } },
          data: { isActive: true }
        });
        result.updated = activateResult.count;
        result.details.push(`Activated ${activateResult.count} courts`);
        break;

      case 'deactivate':
        const deactivateResult = await prisma.court.updateMany({
          where: { id: { in: courtIds } },
          data: { isActive: false }
        });
        result.updated = deactivateResult.count;
        result.details.push(`Deactivated ${deactivateResult.count} courts`);
        break;

      case 'updatePrice':
        if (priceChangeType === 'set' && pricePerHour !== undefined) {
          const priceResult = await prisma.court.updateMany({
            where: { id: { in: courtIds } },
            data: { pricePerHour }
          });
          result.updated = priceResult.count;
          result.details.push(`Set price to ₹${pricePerHour}/hr for ${priceResult.count} courts`);
        } else if (priceChangeType && priceChangeValue) {
          // For increase/decrease, update each court individually
          for (const court of courts) {
            const newPrice = priceChangeType === 'increase' 
              ? court.pricePerHour + priceChangeValue
              : Math.max(0, court.pricePerHour - priceChangeValue);
            
            await prisma.court.update({
              where: { id: court.id },
              data: { pricePerHour: newPrice }
            });
            result.updated++;
          }
          result.details.push(`${priceChangeType}d price by ₹${priceChangeValue} for ${result.updated} courts`);
        }
        break;

      case 'blockSlots':
        if (date) {
          const blockDate = new Date(date);
          
          for (const courtId of courtIds) {
            const updateResult = await prisma.timeSlot.updateMany({
              where: {
                courtId,
                date: blockDate,
                ...(startTime && endTime ? {
                  startTime: { gte: startTime },
                  endTime: { lte: endTime }
                } : {})
              },
              data: {
                isBlocked: true,
                blockReason: blockReason || 'Blocked by admin'
              }
            });
            result.updated += updateResult.count;
          }
          result.details.push(`Blocked ${result.updated} time slots`);
        }
        break;

      case 'unblockSlots':
        if (date) {
          const unblockDate = new Date(date);
          
          for (const courtId of courtIds) {
            const updateResult = await prisma.timeSlot.updateMany({
              where: {
                courtId,
                date: unblockDate,
                isBlocked: true,
                ...(startTime && endTime ? {
                  startTime: { gte: startTime },
                  endTime: { lte: endTime }
                } : {})
              },
              data: {
                isBlocked: false,
                blockReason: null
              }
            });
            result.updated += updateResult.count;
          }
          result.details.push(`Unblocked ${result.updated} time slots`);
        }
        break;
    }

    // TODO: Send notifications to owners if notifyOwners is true

    return NextResponse.json({
      success: true,
      message: `Bulk ${operation} completed`,
      data: {
        operation,
        courtsAffected: courts.length,
        result,
        performedBy: adminAuth.user.id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform bulk update' },
      { status: 500 }
    );
  }
}
