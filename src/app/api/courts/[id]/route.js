/**
 * Court CRUD API
 * GET    /api/courts/[id] - Get court details
 * PUT    /api/courts/[id] - Update court (owner only)
 * DELETE /api/courts/[id] - Soft-delete court (owner only)
 */

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyAuthToken } from "../../../../lib/auth";
import { facilityValidation, validateRequest } from "../../../../validations/facility.validation.js";

async function loadCourtWithOwner(courtId) {
  return prisma.court.findUnique({
    where: { id: courtId },
    include: {
      facility: { select: { id: true, ownerId: true, name: true } }
    }
  });
}

// GET /api/courts/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true, status: true } }
      }
    });

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { court } });
  } catch (error) {
    console.error('Get court error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courts/[id]
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

    const { id } = await params;
    const court = await loadCourtWithOwner(id);

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    if (court.facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only edit courts in your own venues' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = validateRequest(body, facilityValidation.updateCourt);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const updated = await prisma.court.update({
      where: { id },
      data: validation.data,
      include: { facility: { select: { id: true, name: true } } }
    });

    return NextResponse.json({
      success: true,
      message: 'Court updated successfully',
      data: { court: updated }
    });
  } catch (error) {
    console.error('Update court error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courts/[id]
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

    const { id } = await params;
    const court = await loadCourtWithOwner(id);

    if (!court) {
      return NextResponse.json(
        { success: false, message: 'Court not found' },
        { status: 404 }
      );
    }

    if (court.facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only delete courts in your own venues' },
        { status: 403 }
      );
    }

    // Soft delete: deactivate so historical bookings remain intact
    await prisma.court.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Court deleted successfully'
    });
  } catch (error) {
    console.error('Delete court error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
