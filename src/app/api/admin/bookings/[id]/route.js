/**
 * ADMIN INDIVIDUAL BOOKING MANAGEMENT API
 * =======================================
 * 
 * GET    /api/admin/bookings/[id] - Get booking details
 * PUT    /api/admin/bookings/[id] - Update booking status
 * DELETE /api/admin/bookings/[id] - Cancel booking with refund
 * 
 * Allows admins to manage individual bookings with full control
 * 
 * @module api/admin/bookings/[id]
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/admin";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
  adminNote: z.string().max(500).optional(),
  notifyUser: z.boolean().default(true),
  refundAmount: z.number().min(0).optional() // For partial refunds
});

// ==========================================
// GET /api/admin/bookings/[id]
// ==========================================

/**
 * Get detailed booking information for admin review
 * 
 * @requires Admin Role
 * @param {string} id - Booking ID
 * 
 * @returns {Object} Complete booking details with history
 */
export async function GET(request, { params }) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isVerified: true,
            createdAt: true,
            _count: {
              select: {
                bookings: true,
                reviews: true
              }
            }
          }
        },
        court: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                city: true,
                state: true,
                pincode: true,
                ownerId: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            amount: true,
            processingFee: true,
            gst: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
            completedAt: true,
            failureReason: true
          }
        },
        refunds: {
          select: {
            id: true,
            amount: true,
            status: true,
            reason: true,
            createdAt: true,
            processedAt: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Calculate booking status and timing
    const now = new Date();
    const bookingDateTime = new Date(booking.bookingDate);
    const [startHour, startMin] = booking.startTime.split(':').map(Number);
    bookingDateTime.setHours(startHour, startMin, 0, 0);

    const isPast = bookingDateTime < now;
    const isUpcoming = bookingDateTime > now;
    const hoursUntilBooking = Math.floor((bookingDateTime - now) / (1000 * 60 * 60));

    // Calculate potential refund amount
    let refundInfo = null;
    if (booking.status === 'CONFIRMED' && booking.payment?.status === 'COMPLETED') {
      const totalPaid = booking.payment.totalAmount;
      const hoursUntil = hoursUntilBooking;
      
      // Refund policy logic
      let refundPercentage = 0;
      if (hoursUntil >= 24) {
        refundPercentage = 100; // Full refund
      } else if (hoursUntil >= 2) {
        refundPercentage = 50; // 50% refund
      } else {
        refundPercentage = 0; // No refund
      }
      
      refundInfo = {
        eligible: refundPercentage > 0,
        percentage: refundPercentage,
        amount: Math.round(totalPaid * refundPercentage / 100),
        policy: hoursUntil >= 24 ? 'Full refund (24+ hours)' :
                hoursUntil >= 2 ? 'Partial refund (2-24 hours)' :
                'No refund (< 2 hours)'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Booking details retrieved',
      data: {
        booking: {
          ...booking,
          timing: {
            isPast,
            isUpcoming,
            hoursUntilBooking,
            canCancel: booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED',
            canModify: !isPast && booking.status !== 'COMPLETED'
          },
          refundInfo
        }
      }
    });

  } catch (error) {
    console.error('Admin get booking error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve booking details' },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT /api/admin/bookings/[id]
// ==========================================

/**
 * Update booking status or details
 * 
 * @requires Admin Role
 * @param {string} id - Booking ID
 * @body {Object} Update data (status, adminNote, notifyUser)
 * 
 * @returns {Object} Updated booking
 */
export async function PUT(request, { params }) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    const { id } = await params;
    const body = await request.json();

    // Validate request
    const validationResult = updateBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { status, adminNote, notifyUser, refundAmount } = validationResult.data;

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: { select: { id: true, status: true, totalAmount: true } }
      }
    });

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Handle status-specific updates
    if (status === 'CONFIRMED' && currentBooking.status !== 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    }

    if (status === 'CANCELLED' && currentBooking.status !== 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = adminNote || `Cancelled by admin: ${admin.name}`;
    }

    if (status === 'COMPLETED' && currentBooking.status !== 'COMPLETED') {
      // Auto-complete past bookings
      const now = new Date();
      const bookingDate = new Date(currentBooking.bookingDate);
      if (bookingDate < now) {
        updateData.status = 'COMPLETED';
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        court: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                address: true
              }
            }
          }
        }
      }
    });

    // Handle refund if cancelling a paid booking
    let refundResult = null;
    if (status === 'CANCELLED' && currentBooking.payment?.status === 'COMPLETED') {
      try {
        const refundAmountToProcess = refundAmount || currentBooking.payment.totalAmount;
        
        // Create refund record
        refundResult = await prisma.refund.create({
          data: {
            paymentId: currentBooking.payment.id,
            bookingId: currentBooking.id,
            userId: currentBooking.userId,
            amount: refundAmountToProcess,
            originalAmount: currentBooking.payment.totalAmount,
            refundPercentage: Math.round((refundAmountToProcess / currentBooking.payment.totalAmount) * 100),
            reason: adminNote || `Admin cancellation by ${admin.name}`,
            status: 'PENDING',
            notes: {
              processedBy: admin.id,
              processedByName: admin.name,
              timestamp: new Date().toISOString()
            }
          }
        });

        // TODO: Integrate with payment gateway for actual refund processing
        // This would call Razorpay refund API

      } catch (refundError) {
        console.error('Refund processing error:', refundError);
        // Continue with booking update even if refund fails
      }
    }

    // TODO: Send notification to user if notifyUser is true
    if (notifyUser) {
      // Create notification record
      try {
        await prisma.notification.create({
          data: {
            userId: currentBooking.user.id,
            type: status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' :
                  status === 'CANCELLED' ? 'BOOKING_CANCELLED' : 'SYSTEM_ALERT',
            title: `Booking ${status.toLowerCase()}`,
            message: `Your booking for ${currentBooking.court.facility.name} has been ${status.toLowerCase()} by admin.`,
            data: {
              bookingId: id,
              adminId: admin.id,
              adminName: admin.name,
              note: adminNote
            }
          }
        });
      } catch (notificationError) {
        console.error('Notification creation error:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      data: {
        booking: updatedBooking,
        refund: refundResult,
        adminAction: {
          performedBy: admin.name,
          timestamp: new Date().toISOString(),
          note: adminNote
        }
      }
    });

  } catch (error) {
    console.error('Admin update booking error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE /api/admin/bookings/[id]
// ==========================================

/**
 * Force cancel a booking with automatic refund processing
 * 
 * @requires Admin Role
 * @param {string} id - Booking ID
 * @body {Object} Cancellation data (reason, refundAmount)
 * 
 * @returns {Object} Cancellation confirmation with refund details
 */
export async function DELETE(request, { params }) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const admin = adminAuth.user;
    const { id } = await params;
    
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional for DELETE
    }

    const { reason, refundAmount } = body;

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: true,
        court: {
          include: {
            facility: { select: { name: true } }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      );
    }

    // Cancel the booking
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || `Force cancelled by admin: ${admin.name}`
      }
    });

    // Process refund if payment exists
    let refundResult = null;
    if (booking.payment && booking.payment.status === 'COMPLETED') {
      const refundAmountToProcess = refundAmount || booking.payment.totalAmount;
      
      refundResult = await prisma.refund.create({
        data: {
          paymentId: booking.payment.id,
          bookingId: booking.id,
          userId: booking.userId,
          amount: refundAmountToProcess,
          originalAmount: booking.payment.totalAmount,
          refundPercentage: Math.round((refundAmountToProcess / booking.payment.totalAmount) * 100),
          reason: reason || `Force cancellation by admin ${admin.name}`,
          status: 'PENDING',
          notes: {
            processedBy: admin.id,
            processedByName: admin.name,
            forceCancel: true,
            timestamp: new Date().toISOString()
          }
        }
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: booking.user.id,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.court.facility.name} has been cancelled by admin.`,
        data: {
          bookingId: id,
          adminId: admin.id,
          adminName: admin.name,
          reason: reason || 'Administrative cancellation',
          refundAmount: refundResult?.amount || 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: cancelledBooking,
        refund: refundResult,
        cancellation: {
          performedBy: admin.name,
          reason: reason || 'Administrative cancellation',
          timestamp: new Date().toISOString(),
          refundAmount: refundResult?.amount || 0,
          refundStatus: refundResult?.status || 'N/A'
        }
      }
    });

  } catch (error) {
    console.error('Admin cancel booking error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel booking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}