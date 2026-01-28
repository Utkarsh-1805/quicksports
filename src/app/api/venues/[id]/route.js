import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyAuthToken } from "../../../../lib/auth";

// GET /api/venues/[id] - Get single venue details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const facility = await prisma.facility.findFirst({
      where: {
        id,
        status: 'APPROVED'
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        courts: {
          where: { isActive: true },
          include: {
            timeSlots: {
              where: { isActive: true },
              orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
              ]
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    if (!facility) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { venue: facility }
    });
    
  } catch (error) {
    console.error('Get venue details error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/venues/[id] - Update venue (Owner only)
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    
    const { id } = params;
    const body = await request.json();
    
    // Check if user owns this facility or is admin
    const facility = await prisma.facility.findUnique({
      where: { id }
    });
    
    if (!facility) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }
    
    if (facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only update your own venues' },
        { status: 403 }
      );
    }
    
    const updatedFacility = await prisma.facility.update({
      where: { id },
      data: {
        ...body,
        // Reset status to PENDING if owner makes changes
        ...(user.role !== 'ADMIN' && { status: 'PENDING' })
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Venue updated successfully',
      data: { venue: updatedFacility }
    });
    
  } catch (error) {
    console.error('Update venue error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/venues/[id] - Delete venue (Owner/Admin only)
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    
    const { id } = params;
    
    // Check if user owns this facility or is admin
    const facility = await prisma.facility.findUnique({
      where: { id }
    });
    
    if (!facility) {
      return NextResponse.json(
        { success: false, message: 'Venue not found' },
        { status: 404 }
      );
    }
    
    if (facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own venues' },
        { status: 403 }
      );
    }
    
    await prisma.facility.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Venue deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete venue error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}