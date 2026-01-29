import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET /api/home - Get home page data
export async function GET(request) {
  try {
    // Get popular venues (by number of courts first, then by creation date)
    const popularVenues = await prisma.facility.findMany({
      where: {
        status: 'APPROVED'
      },
      take: 6,
      include: {
        courts: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sportType: true,
            pricePerHour: true
          }
        },
        _count: {
          select: {
            courts: { where: { isActive: true } }
          }
        }
      },
      orderBy: [
        { courts: { _count: 'desc' } },   // Most courts = potentially most popular
        { createdAt: 'desc' }             // Newer venues as tiebreaker
      ]
    });

    // Get popular sports (by number of courts)
    const popularSports = await prisma.court.groupBy({
      by: ['sportType'],
      where: {
        isActive: true,
        facility: {
          status: 'APPROVED'
        }
      },
      _count: {
        sportType: true
      },
      orderBy: {
        _count: {
          sportType: 'desc'
        }
      },
      take: 8
    });

    // Get some statistics
    const stats = {
      totalVenues: await prisma.facility.count({
        where: { status: 'APPROVED' }
      }),
      totalCourts: await prisma.court.count({
        where: {
          isActive: true,
          facility: { status: 'APPROVED' }
        }
      }),
      totalBookings: await prisma.booking.count({
        where: { status: 'CONFIRMED' }
      }),
      totalUsers: await prisma.user.count({
        where: { role: 'USER' }
      })
    };

    return NextResponse.json({
      success: true,
      data: {
        popularVenues,
        popularSports,
        stats
      }
    });
    
  } catch (error) {
    console.error('Get home data error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}