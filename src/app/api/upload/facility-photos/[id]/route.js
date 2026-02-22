/**
 * DELETE FACILITY PHOTO API
 * =========================
 * 
 * DELETE /api/upload/facility-photos/[id] - Delete a specific photo
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../../lib/auth";
import prisma from "../../../../../lib/prisma";
import { unlink } from 'fs/promises';
import path from 'path';

/**
 * DELETE /api/upload/facility-photos/[id]
 * 
 * Delete a specific facility photo
 * 
 * @requires Authentication
 * @requires Facility Owner or Admin
 */
export async function DELETE(request, { params }) {
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
    const { id: photoId } = await params;

    // ==========================================
    // STEP 2: Find Photo and Verify Ownership
    // ==========================================
    const photo = await prisma.facilityPhoto.findUnique({
      where: { id: photoId },
      include: {
        facility: {
          select: { ownerId: true, name: true }
        }
      }
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found' },
        { status: 404 }
      );
    }

    if (photo.facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only delete photos from your own facilities' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 3: Delete File from Disk
    // ==========================================
    try {
      const filepath = path.join(process.cwd(), 'public', photo.url);
      await unlink(filepath);
    } catch (fileError) {
      console.warn('File deletion error (file may not exist):', fileError.message);
      // Continue with database deletion even if file doesn't exist
    }

    // ==========================================
    // STEP 4: Delete from Database
    // ==========================================
    await prisma.facilityPhoto.delete({
      where: { id: photoId }
    });

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}