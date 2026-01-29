import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET /api/amenities - Get all available amenities
export async function GET(request) {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            facilities: true
          }
        }
      }
    });
    
    const amenitiesWithCount = amenities.map(amenity => ({
      id: amenity.id,
      name: amenity.name,
      icon: amenity.icon,
      facilityCount: amenity._count.facilities
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        amenities: amenitiesWithCount,
        total: amenities.length
      }
    });
    
  } catch (error) {
    console.error('Get amenities error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load amenities' },
      { status: 500 }
    );
  }
}
