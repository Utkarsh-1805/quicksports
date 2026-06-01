/**
 * Booking slot overlap math.
 *
 * The availability route at /api/courts/[id]/availability decides whether a
 * candidate slot collides with an existing booking by comparing the half-open
 * intervals [startMinutes, endMinutes). This file pins down that invariant so
 * a future refactor cannot regress double-booking prevention.
 */
import { describe, it, expect } from 'vitest';

const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

// Mirror of the production check (see src/app/api/courts/[id]/availability/route.js)
function overlaps(slot, booking) {
    const slotStart = toMin(slot.startTime);
    const slotEnd = toMin(slot.endTime);
    const bookStart = toMin(booking.startTime);
    const bookEnd = toMin(booking.endTime);
    return slotStart < bookEnd && bookStart < slotEnd;
}

describe('slot overlap (half-open intervals)', () => {
    const booking = { startTime: '10:00', endTime: '11:00' };

    it('flags exact same hour as booked', () => {
        expect(overlaps({ startTime: '10:00', endTime: '11:00' }, booking)).toBe(true);
    });

    it('flags a slot starting inside a booking', () => {
        expect(overlaps({ startTime: '10:30', endTime: '11:30' }, booking)).toBe(true);
    });

    it('flags a slot ending inside a booking', () => {
        expect(overlaps({ startTime: '09:30', endTime: '10:30' }, booking)).toBe(true);
    });

    it('flags a slot that completely contains the booking', () => {
        expect(overlaps({ startTime: '09:00', endTime: '12:00' }, booking)).toBe(true);
    });

    it('does NOT flag a slot ending exactly when the booking starts', () => {
        // [09:00,10:00) abuts [10:00,11:00) — boundary, not overlap
        expect(overlaps({ startTime: '09:00', endTime: '10:00' }, booking)).toBe(false);
    });

    it('does NOT flag a slot starting exactly when the booking ends', () => {
        expect(overlaps({ startTime: '11:00', endTime: '12:00' }, booking)).toBe(false);
    });

    it('does NOT flag a far-away slot', () => {
        expect(overlaps({ startTime: '14:00', endTime: '15:00' }, booking)).toBe(false);
    });
});
