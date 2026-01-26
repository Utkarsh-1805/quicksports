import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authenticateUser } from "../../../../lib/auth";

// PUT /api/bookings/[id] - Update booking (cancel)
export async function PUT(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    const { action } = body;
    
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        court: {
          include: {
            facility: {
              select: {
                name: true,
                ownerId: true
              }
            }
          }
        }
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns this booking or is facility owner/admin
    const canModify = booking.userId === user.id || 
                      booking.court.facility.ownerId === user.id || 
                      user.role === 'ADMIN';
    
    if (!canModify) {
      return NextResponse.json(
        { success: false, message: 'You can only modify your own bookings' },
        { status: 403 }
      );
    }
    
    // Handle cancel action
    if (action === 'cancel') {
      if (booking.status === 'CANCELLED') {
        return NextResponse.json(
          { success: false, message: 'Booking is already cancelled' },
          { status: 400 }
        );
      }
      
      if (booking.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, message: 'Cannot cancel completed booking' },
          { status: 400 }
        );
      }
      
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED'
        },
        include: {
          court: {
            include: {
              facility: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking: updatedBooking }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/bookings/[id] - Get single booking details
export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { 
            court: { 
              facility: { 
                ownerId: user.id 
              } 
            } 
          },
          ...(user.role === 'ADMIN' ? [{}] : [])
        ]
      },
      include: {
        court: {
          include: {
            facility: {
              select: {
                name: true,
                address: true,
                city: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { booking }
    });
    
  } catch (error) {
    console.error('Get booking details error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}