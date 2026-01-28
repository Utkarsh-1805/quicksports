import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { verifyAuthToken } from "../../../../../lib/auth";
import { facilityValidation, validateRequest } from "../../../../../validations/facility.validation.js";

// GET /api/venues/[id]/courts - Get courts for a venue
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const courts = await prisma.court.findMany({
      where: {
        facilityId: id,
        isActive: true
      },
      include: {
        timeSlots: {
          where: { isActive: true },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        facility: {
          select: {
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: { courts }
    });
    
  } catch (error) {
    console.error('Get courts error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/venues/[id]/courts - Create court for venue (Owner only)
export async function POST(request, { params }) {
  try {
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    
    const { id: facilityId } = await params;
    
    // Check if user owns this facility
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId }
    });
    
    if (!facility) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }
    
    if (facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only add courts to your own venues' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validate and sanitize request body
    const validation = validateRequest(body, facilityValidation.createCourt);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const courtData = validation.data;
    
    const court = await prisma.court.create({
      data: {
        ...courtData,
        facilityId
      },
      include: {
        facility: {
          select: {
            name: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Court created successfully',
      data: { court }
    });
    
  } catch (error) {
    console.error('Create court error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}