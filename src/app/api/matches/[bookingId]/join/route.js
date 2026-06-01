/**
 * MATCH-MAKING — join / leave
 * ============================
 *
 * POST   /api/matches/[bookingId]/join  → adds caller as ACCEPTED participant
 * DELETE /api/matches/[bookingId]/join  → caller leaves (status=LEFT)
 *
 * Auto-acceptance keeps the v1 flow simple. A host-approval flow can be added
 * later by switching the default ParticipantStatus to REQUESTED + adding an
 * /accept route.
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }
        const user = auth.user;
        const { bookingId } = await params;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                participants: { where: { status: 'ACCEPTED' } },
            },
        });

        if (!booking || !booking.isPublic) {
            return NextResponse.json(
                { success: false, message: 'Match not found' },
                { status: 404 }
            );
        }
        if (booking.userId === user.id) {
            return NextResponse.json(
                { success: false, message: 'You are already the host of this match' },
                { status: 400 }
            );
        }
        const acceptedCount = booking.participants.length;
        if (acceptedCount + 1 >= booking.maxPlayers) {
            // +1 because host counts as a player; if accepted equals max-1, match is full
        }
        if (acceptedCount >= booking.maxPlayers - 1) {
            return NextResponse.json(
                { success: false, message: 'This match is full' },
                { status: 409 }
            );
        }

        // Upsert participant: if user previously LEFT, this re-activates the row
        const participant = await prisma.bookingParticipant.upsert({
            where: { bookingId_userId: { bookingId, userId: user.id } },
            update: { status: 'ACCEPTED' },
            create: { bookingId, userId: user.id, status: 'ACCEPTED' },
        });

        return NextResponse.json({
            success: true,
            message: "You're in — see you on court!",
            data: { participant },
        });
    } catch (error) {
        console.error('Join match error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to join match' },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }
        const user = auth.user;
        const { bookingId } = await params;

        const participant = await prisma.bookingParticipant.findUnique({
            where: { bookingId_userId: { bookingId, userId: user.id } },
        });

        if (!participant) {
            return NextResponse.json(
                { success: false, message: "You're not part of this match" },
                { status: 404 }
            );
        }

        const updated = await prisma.bookingParticipant.update({
            where: { id: participant.id },
            data: { status: 'LEFT' },
        });

        return NextResponse.json({
            success: true,
            message: 'You have left the match',
            data: { participant: updated },
        });
    } catch (error) {
        console.error('Leave match error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to leave match' },
            { status: 500 }
        );
    }
}
