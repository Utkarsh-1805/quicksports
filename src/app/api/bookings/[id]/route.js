/**
 * SINGLE BOOKING API
 * ==================
 * 
 * GET /api/bookings/{id} - Get booking details
 * PUT /api/bookings/{id} - Update booking (legacy cancel/status update)
 * 
 * All endpoints require authentication.
 * Users can only access their own bookings.
 * Facility owners can see bookings for their facilities.
 * Admins can see all bookings.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

/**
 * PUT /api/bookings/[id] - Update booking (cancel/status)
 * 
 * ACTIONS:
 * - { action: "cancel" } - Cancel the booking
 * - { status: "CONFIRMED" } - Update status (for admins/owners)
 */
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    const { id } = await params;
    const body = await request.json();
    const { action, status } = body;
    
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
          status: 'CANCELLED'
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
    
    // Handle direct status update
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status' },
          { status: 400 }
        );
      }
      
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status },
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
        message: `Booking status updated to ${status}`,
        data: { booking: updatedBooking }
      });
    }
    
    return NextResponse.json(
      { success: false, message: 'No valid action or status provided' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update booking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/[id] - Get single booking details
 * 
 * Returns detailed information about a specific booking.
 * 
 * ACCESS:
 * - User can view their own bookings
 * - Facility owner can view bookings for their facilities
 * - Admin can view all bookings
 */
export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    const { id } = await params;
    
    // Find booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true,
            openingTime: true,
            closingTime: true,
            facility: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                ownerId: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
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
    
    // Check access permissions
    const isOwner = booking.userId === user.id;
    const isFacilityOwner = booking.court.facility.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isOwner && !isFacilityOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Determine booking state
    const now = new Date();
    const bookingDateTime = new Date(booking.bookingDate);
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    bookingDateTime.setHours(startHour, startMin, 0, 0);
    
    const isUpcoming = bookingDateTime > now;
    const isPast = bookingDateTime <= now;
    
    // Can cancel if booking is in the future and status is PENDING or CONFIRMED
    const canCancel = isUpcoming && ['PENDING', 'CONFIRMED'].includes(booking.status);
    
    // Can pay if status is PENDING
    const canPay = booking.status === 'PENDING';
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        date: booking.bookingDate.toISOString().split('T')[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        paymentId: booking.paymentId,
        court: {
          id: booking.court.id,
          name: booking.court.name,
          sportType: booking.court.sportType,
          pricePerHour: booking.court.pricePerHour,
          facility: {
            id: booking.court.facility.id,
            name: booking.court.facility.name,
            address: booking.court.facility.address,
            city: booking.court.facility.city,
            state: booking.court.facility.state
          }
        },
        user: booking.user,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      },
      meta: {
        isUpcoming,
        isPast,
        canCancel,
        canPay,
        viewerRole: isAdmin ? 'admin' : isFacilityOwner ? 'facility_owner' : 'user'
      },
      actions: {
        ...(canCancel && { cancelUrl: `/api/bookings/${booking.id}/cancel` }),
        ...(canPay && { paymentUrl: `/api/bookings/${booking.id}/pay` })
      }
    });
    
  } catch (error) {
    console.error('Get booking details error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch booking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}