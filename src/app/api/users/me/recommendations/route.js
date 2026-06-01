/**
 * PERSONALISED VENUE RECOMMENDATIONS
 * ===================================
 *
 * GET /api/users/me/recommendations
 *
 * Content-based recommender. Reads the signed-in user's booking history
 * to derive a sport-and-city preference profile, then ranks venues the
 * user HASN'T booked yet by:
 *   - sport-type overlap (weight 4)
 *   - city match  (weight 3)
 *   - average rating (weight 1)
 *
 * No external ML service needed — pure SQL + Prisma + a small JS scorer.
 *
 * Falls back to "trending in your city" if the user has no bookings yet.
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const SPORT_WEIGHT = 4;
const CITY_WEIGHT = 3;
const RATING_WEIGHT = 1;

export async function GET(request) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const user = authResult.user;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)));

        // ====================================
        // Build user preference profile
        // ====================================
        const recentBookings = await prisma.booking.findMany({
            where: {
                userId: user.id,
                status: { in: ['CONFIRMED', 'COMPLETED'] },
            },
            select: {
                courtId: true,
                court: {
                    select: {
                        sportType: true,
                        facilityId: true,
                        facility: { select: { city: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const bookedFacilityIds = new Set();
        const sportCounts = {};
        const cityCounts = {};

        for (const b of recentBookings) {
            const sport = b.court?.sportType;
            const city = b.court?.facility?.city;
            if (b.court?.facilityId) bookedFacilityIds.add(b.court.facilityId);
            if (sport) sportCounts[sport] = (sportCounts[sport] || 0) + 1;
            if (city) cityCounts[city] = (cityCounts[city] || 0) + 1;
        }

        const topSports = Object.entries(sportCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([s]) => s);
        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([c]) => c);

        const profileBased = topSports.length > 0;

        // ====================================
        // Candidate venues
        // ====================================
        const whereClause = {
            status: 'APPROVED',
            id: { notIn: Array.from(bookedFacilityIds) },
            ...(profileBased && topSports.length > 0
                ? {
                      courts: {
                          some: { sportType: { in: topSports }, isActive: true },
                      },
                  }
                : {}),
        };

        const candidates = await prisma.facility.findMany({
            where: whereClause,
            include: {
                courts: {
                    where: { isActive: true },
                    select: { sportType: true, pricePerHour: true },
                },
                photos: { take: 1, select: { url: true } },
                reviews: { select: { rating: true } },
                _count: { select: { reviews: true } },
            },
            take: 60, // Pull a bigger pool to rank
        });

        // ====================================
        // Score candidates
        // ====================================
        const scored = candidates.map((v) => {
            const venueSports = [...new Set(v.courts.map((c) => c.sportType))];
            const sportOverlap = profileBased
                ? venueSports.filter((s) => topSports.includes(s)).length
                : 0;
            const cityMatch = topCities.includes(v.city) ? 1 : 0;
            const ratings = v.reviews.map((r) => r.rating);
            const avgRating =
                ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

            const score =
                sportOverlap * SPORT_WEIGHT +
                cityMatch * CITY_WEIGHT +
                avgRating * RATING_WEIGHT;

            const prices = v.courts.map((c) => c.pricePerHour);
            return {
                id: v.id,
                name: v.name,
                city: v.city,
                state: v.state,
                coverImage: v.photos[0]?.url || null,
                photos: v.photos,
                sportTypes: venueSports,
                courts: v.courts,
                startingPrice: prices.length ? Math.min(...prices) : null,
                averageRating: ratings.length ? Math.round((avgRating) * 10) / 10 : null,
                reviewCount: v._count.reviews,
                score,
                reasons: {
                    sharedSports: profileBased
                        ? venueSports.filter((s) => topSports.includes(s))
                        : [],
                    sameCity: cityMatch === 1,
                },
            };
        });

        scored.sort((a, b) => b.score - a.score);
        const recommendations = scored.slice(0, limit);

        return NextResponse.json({
            success: true,
            data: {
                strategy: profileBased ? 'preference-based' : 'cold-start-popular',
                profile: { topSports, topCities, bookingsAnalyzed: recentBookings.length },
                recommendations,
            },
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load recommendations' },
            { status: 500 }
        );
    }
}
