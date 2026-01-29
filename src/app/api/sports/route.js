import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET /api/sports - Get all sport types with statistics
export async function GET(request) {
  try {
    // Get all sport types with court counts
    const sportStats = await prisma.court.groupBy({
      by: ['sportType'],
      where: {
        isActive: true,
        facility: { status: 'APPROVED' }
      },
      _count: { sportType: true },
      _avg: { pricePerHour: true },
      _min: { pricePerHour: true },
      _max: { pricePerHour: true }
    });
    
    // Get venue count per sport
    const sportsWithVenues = await Promise.all(
      sportStats.map(async (sport) => {
        const venueCount = await prisma.facility.count({
          where: {
            status: 'APPROVED',
            courts: {
              some: {
                sportType: sport.sportType,
                isActive: true
              }
            }
          }
        });
        
        return {
          type: sport.sportType,
          courtCount: sport._count.sportType,
          venueCount,
          priceRange: {
            min: sport._min.pricePerHour,
            max: sport._max.pricePerHour,
            avg: parseFloat((sport._avg.pricePerHour || 0).toFixed(2))
          }
        };
      })
    );
    
    // Sort by court count
    sportsWithVenues.sort((a, b) => b.courtCount - a.courtCount);
    
    return NextResponse.json({
      success: true,
      data: {
        sports: sportsWithVenues,
        total: sportsWithVenues.length
      }
    });
    
  } catch (error) {
    console.error('Get sports error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load sports' },
      { status: 500 }
    );
  }
}
