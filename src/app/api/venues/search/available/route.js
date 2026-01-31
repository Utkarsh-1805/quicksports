/**
 * Search with Availability API
 * POST /api/venues/search/available - Search venues with real-time availability
 */

import { NextResponse } from "next/server";
import { searchWithAvailability } from "@/services/search.service";

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      date,
      startTime,
      endTime,
      sportType,
      city,
      latitude,
      longitude,
      radius,
      minPrice,
      maxPrice,
      page,
      limit
    } = body;

    // Validate date format if provided
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid date format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { success: false, message: "Invalid start time format. Use HH:MM" },
        { status: 400 }
      );
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, message: "Invalid end time format. Use HH:MM" },
        { status: 400 }
      );
    }

    // Validate coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return NextResponse.json(
          { success: false, message: "Both latitude and longitude are required" },
          { status: 400 }
        );
      }
      if (latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { success: false, message: "Latitude must be between -90 and 90" },
          { status: 400 }
        );
      }
      if (longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, message: "Longitude must be between -180 and 180" },
          { status: 400 }
        );
      }
    }

    // Validate price range
    if (minPrice !== undefined && minPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Minimum price cannot be negative" },
        { status: 400 }
      );
    }
    if (maxPrice !== undefined && maxPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Maximum price cannot be negative" },
        { status: 400 }
      );
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return NextResponse.json(
        { success: false, message: "Minimum price cannot be greater than maximum price" },
        { status: 400 }
      );
    }

    const result = await searchWithAvailability({
      date,
      startTime,
      endTime,
      sportType,
      city,
      latitude,
      longitude,
      radius: radius || 10,
      minPrice,
      maxPrice,
      page: page || 1,
      limit: limit || 10
    });

    return NextResponse.json({
      success: true,
      message: "Venues with availability fetched successfully",
      data: result
    });

  } catch (error) {
    console.error("Error searching venues with availability:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search venues" },
      { status: 500 }
    );
  }
}
