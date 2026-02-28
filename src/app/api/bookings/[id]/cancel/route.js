/**
 * CANCEL BOOKING API
 * ==================
 * 
 * PATCH /api/bookings/{id}/cancel
 * 
 * Cancels an existing booking.
 * 
 * RULES:
 * - User can only cancel their own bookings
 * - Cannot cancel past bookings
 * - Cannot cancel already cancelled/completed bookings
 * - Optional cancellation reason
 * 
 * CANCELLATION POLICY (can be customized):
 * - Free cancellation: 24+ hours before booking
 * - 50% refund: 12-24 hours before booking
 * - No refund: Less than 12 hours before booking
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { cancelBookingSchema } from "@/validations/booking.validation";
import { mailService } from "@/lib/mail";

export async function PATCH(request, { params }) {
  try {
    const { id: bookingId } = await params;
    
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
    
    const userId = authResult.user.id;
    const userRole = authResult.user.role;
    
    // ==========================================
    // STEP 2: Parse Request Body (Optional)
    // ==========================================
    let reason = null;
    try {
      const body = await request.json();
      const validation = cancelBookingSchema.safeParse(body);
      if (validation.success && validation.data.reason) {
        reason = validation.data.reason;
      }
    } catch (e) {
      // Body is optional for cancellation
    }
    
    // ==========================================
    // STEP 3: Find Booking
    // ==========================================
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            pricePerHour: true,
            facility: {
              select: {
                id: true,
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
    
    // ==========================================
    // STEP 4: Check Permissions
    // ==========================================
    const isOwner = booking.userId === userId;
    const isFacilityOwner = booking.court.facility.ownerId === userId;
    const isAdmin = userRole === 'ADMIN';
    
    if (!isOwner && !isFacilityOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }
    
    // ==========================================
    // STEP 5: Check if Cancellation is Allowed
    // ==========================================
    // Already cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Booking is already cancelled',
          currentStatus: booking.status
        },
        { status: 400 }
      );
    }
    
    // Already completed
    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot cancel a completed booking',
          currentStatus: booking.status
        },
        { status: 400 }
      );
    }
    
    // Check if booking is in the past
    const now = new Date();
    
    // Create booking datetime by properly combining date and time
    const bookingDateOnly = booking.bookingDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    
    // Create the full booking datetime in local timezone
    const bookingDateTime = new Date(`${bookingDateOnly}T${booking.startTime}:00`);
    
    if (bookingDateTime <= now) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot cancel a booking that has already started or passed',
          bookingTime: bookingDateTime.toISOString(),
          currentTime: now.toISOString()
        },
        { status: 400 }
      );
    }
    
    // ==========================================
    // STEP 6: Calculate Refund (if applicable)
    // ==========================================
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    let refundAmount = 0;
    let refundPolicy = '';
    
    if (booking.status === 'CONFIRMED' && booking.paymentId) {
      // Only calculate refund if payment was made
      if (hoursUntilBooking >= 24) {
        refundPercentage = 100;
        refundPolicy = 'Full refund - cancelled 24+ hours before booking';
      } else if (hoursUntilBooking >= 12) {
        refundPercentage = 50;
        refundPolicy = 'Partial refund - cancelled 12-24 hours before booking';
      } else {
        refundPercentage = 0;
        refundPolicy = 'No refund - cancelled less than 12 hours before booking';
      }
      
      refundAmount = (booking.totalAmount * refundPercentage) / 100;
    }
    
    // ==========================================
    // STEP 7: Cancel the Booking
    // ==========================================
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: now
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sportType: true,
            facility: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true
              }
            }
          }
        }
      }
    });
    
    // Send cancellation email
    try {
      await mailService.sendBookingCancellation({
        user: updatedBooking.user,
        bookingId: updatedBooking.id,
        venue: {
          name: updatedBooking.court.facility.name,
          address: updatedBooking.court.facility.address,
          city: updatedBooking.court.facility.city
        },
        court: {
          name: updatedBooking.court.name,
          sportType: updatedBooking.court.sportType
        },
        date: updatedBooking.bookingDate,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        totalAmount: updatedBooking.totalAmount,
        refund: {
          amount: refundAmount,
          percentage: refundPercentage,
          policy: refundPolicy
        }
      });
    } catch (emailError) {
      // Log error but don't fail the cancellation
      console.error('Failed to send cancellation email:', emailError);
    }
    
    // ==========================================
    // STEP 8: Return Response
    // ==========================================
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        date: updatedBooking.bookingDate.toISOString().split('T')[0],
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        totalAmount: updatedBooking.totalAmount,
        court: updatedBooking.court
      },
      refund: {
        wasPaymentMade: !!booking.paymentId,
        refundPercentage,
        refundAmount,
        policy: refundPolicy,
        ...(reason && { cancellationReason: reason })
      },
      cancelledBy: {
        userId: userId,
        role: isAdmin ? 'admin' : isFacilityOwner ? 'facility_owner' : 'user'
      }
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to cancel booking',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Also support POST method for cancellation
export { PATCH as POST };
