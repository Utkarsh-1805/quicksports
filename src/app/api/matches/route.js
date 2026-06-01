/**
 * MATCH-MAKING — public match browse / create
 * ============================================
 *
 * GET  /api/matches
 *   List public bookings that are looking for additional players. Filters by
 *   sport, city, date. Excludes bookings that are full or already started.
 *
 * POST /api/matches
 *   Body: { bookingId, maxPlayers, skillLevel?, matchNotes? }
 *   Promotes one of the caller's existing CONFIRMED bookings to a public match.
 *   Only the booking host can do this.
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sportType = searchParams.get('sportType');
        const city = searchParams.get('city');
        const dateStr = searchParams.get('date');
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

        const where = {
            isPublic: true,
            status: { in: ['PENDING', 'CONFIRMED'] },
            bookingDate: { gte: new Date(new Date().toISOString().split('T')[0]) },
        };
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            where.bookingDate = new Date(dateStr);
        }
        if (sportType) {
            where.court = { ...(where.court || {}), sportType };
        }
        if (city) {
            where.court = {
                ...(where.court || {}),
                facility: { city: { equals: city, mode: 'insensitive' } },
            };
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                court: {
                    select: {
                        id: true,
                        name: true,
                        sportType: true,
                        pricePerHour: true,
                        facility: { select: { id: true, name: true, city: true, address: true } },
                    },
                },
                participants: {
                    where: { status: 'ACCEPTED' },
                    select: {
                        id: true,
                        userId: true,
                        status: true,
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
            },
            orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }],
            take: limit,
        });

        // Compute open seats and exclude full matches
        const matches = bookings
            .map((b) => {
                const accepted = b.participants.length;
                const seatsRemaining = Math.max(0, b.maxPlayers - 1 - accepted); // -1 because host counts as a player
                return {
                    id: b.id,
                    bookingDate: b.bookingDate,
                    startTime: b.startTime,
                    endTime: b.endTime,
                    sportType: b.court.sportType,
                    skillLevel: b.skillLevel,
                    matchNotes: b.matchNotes,
                    maxPlayers: b.maxPlayers,
                    accepted,
                    seatsRemaining,
                    pricePerHour: b.court.pricePerHour,
                    host: b.user,
                    court: b.court,
                    facility: b.court.facility,
                    participants: b.participants.map((p) => p.user),
                };
            })
            .filter((m) => m.seatsRemaining > 0);

        return NextResponse.json({ success: true, data: { matches, count: matches.length } });
    } catch (error) {
        console.error('List matches error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to load matches' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }
        const user = auth.user;

        const body = await request.json();
        const bookingId = String(body?.bookingId || '');
        const maxPlayers = parseInt(body?.maxPlayers, 10);
        const skillLevel = body?.skillLevel ? String(body.skillLevel).trim().toLowerCase() : null;
        const matchNotes = body?.matchNotes ? String(body.matchNotes).trim().slice(0, 500) : null;

        if (!bookingId) {
            return NextResponse.json(
                { success: false, message: 'bookingId is required' },
                { status: 400 }
            );
        }
        if (!Number.isFinite(maxPlayers) || maxPlayers < 2 || maxPlayers > 20) {
            return NextResponse.json(
                { success: false, message: 'maxPlayers must be between 2 and 20' },
                { status: 400 }
            );
        }
        if (skillLevel && !['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
            return NextResponse.json(
                { success: false, message: 'skillLevel must be beginner, intermediate, or advanced' },
                { status: 400 }
            );
        }

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            return NextResponse.json(
                { success: false, message: 'Booking not found' },
                { status: 404 }
            );
        }
        if (booking.userId !== user.id) {
            return NextResponse.json(
                { success: false, message: 'Only the booking host can open a public match' },
                { status: 403 }
            );
        }
        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
            return NextResponse.json(
                { success: false, message: 'Only active bookings can be promoted to matches' },
                { status: 400 }
            );
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                isPublic: true,
                maxPlayers,
                skillLevel,
                matchNotes,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Match is now open to other players',
            data: { booking: updated },
        });
    } catch (error) {
        console.error('Create match error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to open match' },
            { status: 500 }
        );
    }
}
