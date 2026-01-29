import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/admin';
import { adminUserQuerySchema } from '../../../../validations/admin.validation';

// GET /api/admin/users - List all users for admin management
export async function GET(request) {
  try {
    // Check admin access
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json(
        { error: adminAuth.error },
        { status: adminAuth.status }
      );
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const isVerified = url.searchParams.get('isVerified');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build filter
    const where = {};
    if (role) {
      where.role = role;
    }
    if (isVerified !== null && isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with stats
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            facilities: true,
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalCount = await prisma.user.count({ where });

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        totalFacilities: user._count.facilities,
        totalBookings: user._count.bookings
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}