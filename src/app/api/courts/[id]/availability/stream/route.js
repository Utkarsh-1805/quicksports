/**
 * REAL-TIME COURT AVAILABILITY (Server-Sent Events)
 * ==================================================
 *
 * GET /api/courts/[id]/availability/stream?date=YYYY-MM-DD
 *
 * Streams `text/event-stream` to the client. Every 3 seconds the server polls
 * the bookings + blocked-slots tables for the given court/date and emits an
 * SSE message ONLY if the hash of the occupied-slot set has changed since the
 * last emit. Clients can subscribe via `EventSource` and update their UI
 * instantly when another user books or releases a slot.
 *
 * Why poll-and-diff instead of true pub/sub?
 *   - Next.js App Router (serverless) has no shared in-memory bus, and Razorpay
 *     webhooks already commit booking rows. Polling at 3 s gives perceived
 *     real-time without requiring Redis or Socket.IO.
 *   - Diff-on-hash keeps the stream silent when nothing changed, so the
 *     connection stays cheap.
 */

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const POLL_INTERVAL_MS = 3000;
const MAX_LIFETIME_MS = 10 * 60 * 1000; // Auto-close after 10 minutes

async function snapshotOccupiedSlots(courtId, dateStr) {
    const date = new Date(dateStr);
    const [bookings, blocked] = await Promise.all([
        prisma.booking.findMany({
            where: {
                courtId,
                bookingDate: date,
                status: { in: ['PENDING', 'CONFIRMED'] },
            },
            select: { startTime: true, endTime: true, status: true },
        }),
        prisma.timeSlot.findMany({
            where: { courtId, date, isBlocked: true },
            select: { startTime: true, endTime: true, blockReason: true },
        }),
    ]);

    return {
        booked: bookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime, status: 'booked' })),
        blocked: blocked.map((b) => ({ startTime: b.startTime, endTime: b.endTime, status: 'blocked', reason: b.blockReason || null })),
        timestamp: new Date().toISOString(),
    };
}

function hashSnapshot(snapshot) {
    return JSON.stringify([
        snapshot.booked.map((s) => `b:${s.startTime}-${s.endTime}`).sort(),
        snapshot.blocked.map((s) => `x:${s.startTime}-${s.endTime}`).sort(),
    ]);
}

export async function GET(request, { params }) {
    const { id: courtId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Response('Bad Request: date=YYYY-MM-DD is required', { status: 400 });
    }

    const encoder = new TextEncoder();
    let interval;
    let lifetimeTimer;
    let lastHash = '';
    let closed = false;

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event, data) => {
                if (closed) return;
                try {
                    const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(line));
                } catch (err) {
                    // Connection probably dropped — stop polling
                    closed = true;
                }
            };

            const safeClose = () => {
                if (closed) return;
                closed = true;
                if (interval) clearInterval(interval);
                if (lifetimeTimer) clearTimeout(lifetimeTimer);
                try { controller.close(); } catch {}
            };

            // Emit initial snapshot
            try {
                const initial = await snapshotOccupiedSlots(courtId, dateStr);
                lastHash = hashSnapshot(initial);
                send('snapshot', initial);
            } catch (err) {
                send('error', { message: 'Failed to load initial availability' });
                safeClose();
                return;
            }

            // Poll-and-diff loop
            interval = setInterval(async () => {
                if (closed) return;
                try {
                    const next = await snapshotOccupiedSlots(courtId, dateStr);
                    const nextHash = hashSnapshot(next);
                    if (nextHash !== lastHash) {
                        lastHash = nextHash;
                        send('update', next);
                    } else {
                        // Keep-alive ping so intermediaries don't drop the connection
                        send('ping', { t: Date.now() });
                    }
                } catch (err) {
                    console.error('SSE poll error:', err?.message);
                }
            }, POLL_INTERVAL_MS);

            // Auto-close after MAX_LIFETIME so we don't leak DB connections forever.
            // Clients with `EventSource` will simply reconnect automatically.
            lifetimeTimer = setTimeout(safeClose, MAX_LIFETIME_MS);

            // Abort propagation: client closed the connection
            request.signal?.addEventListener?.('abort', safeClose);
        },

        cancel() {
            closed = true;
            if (interval) clearInterval(interval);
            if (lifetimeTimer) clearTimeout(lifetimeTimer);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
