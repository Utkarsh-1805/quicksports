/**
 * USER REPORTING SYSTEM API
 * =========================
 * 
 * POST /api/reports - Submit a report (report facility, user, or booking issue)
 * GET /api/reports - Get user's submitted reports
 * 
 * Allows users to report:
 * - Inappropriate facility content or behavior
 * - Booking issues and disputes
 * - User misconduct
 * - Platform abuse
 * 
 * @module api/reports
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import { z } from "zod";

// Validation schemas
const reportSchema = z.object({
  type: z.enum(['facility', 'user', 'booking', 'review', 'other']),
  targetId: z.string().min(1, 'Target ID is required'),
  category: z.enum([
    'inappropriate_content',
    'fake_information', 
    'poor_service',
    'booking_dispute',
    'harassment',
    'spam',
    'fraud',
    'safety_concern',
    'other'
  ]),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  evidence: z.array(z.string().url()).optional(), // URLs to evidence (photos, screenshots)
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

/**
 * POST /api/reports
 * 
 * Submit a new report
 * 
 * @requires Authentication
 */
export async function POST(request) {
  try {
    // ==========================================
    // STEP 1: Authenticate User
    // ==========================================
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // ==========================================
    // STEP 2: Validate Request Body
    // ==========================================
    const body = await request.json();
    
    const validation = reportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { type, targetId, category, title, description, evidence, priority } = validation.data;

    // ==========================================
    // STEP 3: Validate Target Exists
    // ==========================================
    let targetExists = false;
    let targetInfo = null;

    switch (type) {
      case 'facility':
        const facility = await prisma.facility.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, ownerId: true }
        });
        if (facility) {
          targetExists = true;
          targetInfo = { name: facility.name, ownerId: facility.ownerId };
        }
        break;

      case 'user':
        const targetUser = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, email: true }
        });
        if (targetUser) {
          targetExists = true;
          targetInfo = { name: targetUser.name, email: targetUser.email };
        }
        break;

      case 'booking':
        const booking = await prisma.booking.findUnique({
          where: { id: targetId },
          include: {
            court: { select: { name: true, facility: { select: { name: true } } } },
            user: { select: { name: true } }
          }
        });
        if (booking) {
          targetExists = true;
          targetInfo = { 
            courtName: booking.court.name,
            facilityName: booking.court.facility.name,
            userName: booking.user.name
          };
        }
        break;

      case 'review':
        const review = await prisma.review.findUnique({
          where: { id: targetId },
          include: {
            user: { select: { name: true } },
            facility: { select: { name: true } }
          }
        });
        if (review) {
          targetExists = true;
          targetInfo = {
            userName: review.user.name,
            facilityName: review.facility.name
          };
        }
        break;

      case 'other':
        targetExists = true; // Allow generic reports
        targetInfo = { description: 'General platform issue' };
        break;
    }

    if (!targetExists) {
      return NextResponse.json(
        { success: false, message: `${type} not found` },
        { status: 404 }
      );
    }

    // ==========================================
    // STEP 4: Check for Duplicate Reports
    // ==========================================
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        targetType: type,
        targetId: targetId,
        status: { in: ['PENDING', 'INVESTIGATING'] }
      }
    });

    if (existingReport) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'You have already reported this item. Please wait for our review.' 
        },
        { status: 409 }
      );
    }

    // ==========================================
    // STEP 5: Create Report
    // ==========================================
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: type.toUpperCase(),
        targetId: targetId,
        category: category,
        title: title,
        description: description,
        evidence: evidence || [],
        priority: priority.toUpperCase(),
        status: 'PENDING',
        metadata: {
          targetInfo: targetInfo,
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      },
      include: {
        reporter: {
          select: { name: true, email: true }
        }
      }
    });

    // ==========================================
    // STEP 6: Auto-escalate High Priority Reports
    // ==========================================
    if (priority === 'high' || category === 'safety_concern' || category === 'fraud') {
      // In a real app, you might send notifications to admin team
      console.log(`HIGH PRIORITY REPORT: ${report.id} - ${title}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. We will review it shortly.',
      data: {
        reportId: report.id,
        status: report.status,
        createdAt: report.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Submit report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * 
 * Get user's submitted reports
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 50)
 * - status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
 * 
 * @requires Authentication
 */
export async function GET(request) {
  try {
    // ==========================================
    // STEP 1: Authenticate User
    // ==========================================
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // ==========================================
    // STEP 2: Parse Query Parameters
    // ==========================================
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit')) || 10));
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // ==========================================
    // STEP 3: Build Query
    // ==========================================
    const where = {
      reporterId: user.id
    };

    if (status && ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    // ==========================================
    // STEP 4: Get Reports
    // ==========================================
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          targetType: true,
          targetId: true,
          category: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          resolution: true,
          resolvedAt: true,
          metadata: true
        }
      }),
      prisma.report.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get reports' },
      { status: 500 }
    );
  }
}