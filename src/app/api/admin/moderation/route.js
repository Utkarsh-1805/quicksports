/**
 * ADMIN MODERATION API
 * ====================
 * 
 * GET /api/admin/moderation - Get reports for admin review
 * PUT /api/admin/moderation/[id] - Take action on a report
 * 
 * Allows admins to:
 * - Review user reports
 * - Investigate issues
 * - Take moderation actions (ban users, remove content, resolve disputes)
 * - Track moderation history
 * 
 * @module api/admin/moderation
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin";
import prisma from "../../../../lib/prisma";
import { z } from "zod";

/**
 * GET /api/admin/moderation
 * 
 * Get reports for admin review
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
 * - priority: 'low' | 'medium' | 'high' 
 * - category: Report category filter
 * - type: 'facility' | 'user' | 'booking' | 'review' | 'other'
 * 
 * @requires Admin Authentication
 */
export async function GET(request) {
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

    // ==========================================
    // STEP 2: Parse Query Parameters
    // ==========================================
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // ==========================================
    // STEP 3: Build Query Filters
    // ==========================================
    const where = {};

    if (status && ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority.toUpperCase())) {
      where.priority = priority.toUpperCase();
    }

    if (type && ['FACILITY', 'USER', 'BOOKING', 'REVIEW', 'OTHER'].includes(type.toUpperCase())) {
      where.targetType = type.toUpperCase();
    }

    if (category) {
      where.category = category.toUpperCase();
    }

    // ==========================================
    // STEP 4: Get Reports with Stats
    // ==========================================
    const [reports, totalCount, stats] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' }, // High priority first
          { createdAt: 'asc' }   // Oldest first
        ],
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          }
        }
      }),
      prisma.report.count({ where }),
      prisma.report.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    // ==========================================
    // STEP 5: Get Priority Breakdown
    // ==========================================
    const priorityStats = await prisma.report.groupBy({
      by: ['priority'],
      _count: { priority: true },
      where: { status: { in: ['PENDING', 'INVESTIGATING'] } }
    });

    // ==========================================
    // STEP 6: Format Statistics
    // ==========================================
    const statusBreakdown = stats.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {});

    const priorityBreakdown = priorityStats.reduce((acc, item) => {
      acc[item.priority.toLowerCase()] = item._count.priority;
      return acc;
    }, {});

    // ==========================================
    // STEP 7: Enhance Reports with Context
    // ==========================================
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        let targetDetails = null;

        try {
          switch (report.targetType) {
            case 'FACILITY':
              const facility = await prisma.facility.findUnique({
                where: { id: report.targetId },
                select: { 
                  id: true, 
                  name: true, 
                  city: true, 
                  status: true,
                  owner: { select: { name: true, email: true } }
                }
              });
              targetDetails = facility;
              break;

            case 'USER':
              const user = await prisma.user.findUnique({
                where: { id: report.targetId },
                select: { 
                  id: true, 
                  name: true, 
                  email: true, 
                  role: true, 
                  isActive: true,
                  createdAt: true
                }
              });
              targetDetails = user;
              break;

            case 'BOOKING':
              const booking = await prisma.booking.findUnique({
                where: { id: report.targetId },
                select: {
                  id: true,
                  status: true,
                  bookingDate: true,
                  totalAmount: true,
                  user: { select: { name: true, email: true } },
                  court: { 
                    select: { 
                      name: true,
                      facility: { select: { name: true } }
                    }
                  }
                }
              });
              targetDetails = booking;
              break;

            case 'REVIEW':
              const review = await prisma.review.findUnique({
                where: { id: report.targetId },
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  isFlagged: true,
                  user: { select: { name: true } },
                  facility: { select: { name: true } }
                }
              });
              targetDetails = review;
              break;
          }
        } catch (error) {
          console.warn(`Failed to fetch details for ${report.targetType}:${report.targetId}`);
        }

        return {
          ...report,
          targetDetails
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        reports: enhancedReports,
        statistics: {
          total: totalCount,
          byStatus: statusBreakdown,
          byPriority: priorityBreakdown
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin moderation GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load reports' },
      { status: 500 }
    );
  }
}