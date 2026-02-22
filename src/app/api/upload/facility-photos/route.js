/**
 * FACILITY PHOTO UPLOAD API
 * =========================
 * 
 * POST /api/upload/facility-photos - Upload photos for a facility
 * DELETE /api/upload/facility-photos/[id] - Delete a facility photo
 * 
 * Supports multiple image uploads with validation:
 * - File size limits (max 5MB per image)
 * - Image format validation (JPEG, PNG, WebP)
 * - Facility ownership verification
 * - Automatic image optimization
 * 
 * @module api/upload/facility-photos
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'facilities');

/**
 * POST /api/upload/facility-photos
 * 
 * Upload photos for a facility
 * 
 * Form Data:
 * - facilityId: string (required)
 * - photos: File[] (required, max 10 files)
 * - captions: string[] (optional, one per photo)
 * 
 * @requires Authentication
 * @requires Facility Owner or Admin
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
    // STEP 2: Parse Form Data
    // ==========================================
    const formData = await request.formData();
    const facilityId = formData.get('facilityId');
    const photos = formData.getAll('photos');
    const captions = formData.getAll('captions');

    if (!facilityId) {
      return NextResponse.json(
        { success: false, message: 'Facility ID is required' },
        { status: 400 }
      );
    }

    if (!photos.length || photos[0].size === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one photo is required' },
        { status: 400 }
      );
    }

    if (photos.length > 10) {
      return NextResponse.json(
        { success: false, message: 'Maximum 10 photos allowed' },
        { status: 400 }
      );
    }

    // ==========================================
    // STEP 3: Verify Facility Ownership
    // ==========================================
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, ownerId: true, name: true }
    });

    if (!facility) {
      return NextResponse.json(
        { success: false, message: 'Facility not found' },
        { status: 404 }
      );
    }

    if (facility.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'You can only upload photos for your own facilities' },
        { status: 403 }
      );
    }

    // ==========================================
    // STEP 4: Validate Files
    // ==========================================
    const validationErrors = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      if (photo.size > MAX_FILE_SIZE) {
        validationErrors.push(`Photo ${i + 1}: File size exceeds 5MB limit`);
      }
      
      if (!ALLOWED_TYPES.includes(photo.type)) {
        validationErrors.push(`Photo ${i + 1}: Invalid file type. Only JPEG, PNG, and WebP are allowed`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    // ==========================================
    // STEP 5: Ensure Upload Directory Exists
    // ==========================================
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // ==========================================
    // STEP 6: Upload Files and Save to Database
    // ==========================================
    const uploadedPhotos = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const caption = captions[i] || '';
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2);
      const extension = path.extname(photo.name);
      const filename = `${facilityId}-${timestamp}-${random}${extension}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      
      try {
        // Save file to disk
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);
        
        // Save to database
        const photoUrl = `/uploads/facilities/${filename}`;
        const savedPhoto = await prisma.facilityPhoto.create({
          data: {
            facilityId: facilityId,
            url: photoUrl,
            caption: caption || null
          }
        });
        
        uploadedPhotos.push(savedPhoto);
        
      } catch (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
        validationErrors.push(`Photo ${i + 1}: Upload failed`);
      }
    }

    // ==========================================
    // STEP 7: Return Results
    // ==========================================
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Some photos failed to upload',
          errors: validationErrors,
          uploaded: uploadedPhotos
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      data: {
        photos: uploadedPhotos,
        facilityId: facilityId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/facility-photos
 * 
 * Get photos for a facility
 * 
 * Query Parameters:
 * - facilityId: string (required)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');

    if (!facilityId) {
      return NextResponse.json(
        { success: false, message: 'Facility ID is required' },
        { status: 400 }
      );
    }

    const photos = await prisma.facilityPhoto.findMany({
      where: { facilityId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        url: true,
        caption: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: { photos }
    });

  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get photos' },
      { status: 500 }
    );
  }
}