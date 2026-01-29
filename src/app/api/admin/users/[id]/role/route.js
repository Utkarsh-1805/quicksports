import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { requireAdmin } from '../../../../../../lib/admin';
import { adminUserRoleSchema } from '../../../../../../validations/admin.validation';

// PUT /api/admin/users/[id]/role - Change user role (admin only)
export async function PUT(request, { params }) {
  try {
    // Check admin access
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
    const validationResult = adminUserRoleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { role, reason } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from demoting themselves
    if (admin.id === user.id && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Log the role change
    console.log(`Admin ${admin.name} changed ${user.name}'s role from ${user.role} to ${role}`);
    console.log(`Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        user: updatedUser,
        adminAction: {
          changedBy: admin.name,
          reason: reason,
          previousRole: user.role,
          newRole: role,
          changedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Admin change user role error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}