import { describe, it, expect } from 'vitest';
import {
    calculateProcessingFees,
    getRefundEligibility,
    generateOrderId,
} from '@/validations/payment.validation';

describe('calculateProcessingFees', () => {
    it('charges 2.99% for cards plus 18% GST on the fee', () => {
        const r = calculateProcessingFees(1000, 'CARD');
        // 1000 * 0.0299 = 29.9, GST = 29.9 * 0.18 = 5.382 → 5.38
        expect(r.baseAmount).toBe(1000);
        expect(r.processingFee).toBe(29.9);
        expect(r.gst).toBe(5.38);
        expect(r.totalFee).toBeCloseTo(35.28, 2);
        expect(r.totalAmount).toBeCloseTo(1035.28, 2);
    });

    it('charges 0.5% for UPI (cheapest)', () => {
        const r = calculateProcessingFees(1000, 'UPI');
        expect(r.processingFee).toBe(5);
        expect(r.gst).toBe(0.9);
    });

    it('falls back to CARD rate for unknown methods', () => {
        const r = calculateProcessingFees(500, 'CRYPTO');
        const card = calculateProcessingFees(500, 'CARD');
        expect(r.processingFee).toBe(card.processingFee);
    });

    it('charges different rates per method', () => {
        const a = 10_000;
        const card = calculateProcessingFees(a, 'CARD').processingFee;
        const upi = calculateProcessingFees(a, 'UPI').processingFee;
        const netBanking = calculateProcessingFees(a, 'NET_BANKING').processingFee;
        const emi = calculateProcessingFees(a, 'EMI').processingFee;
        expect(upi).toBeLessThan(netBanking);
        expect(netBanking).toBeLessThan(card);
        expect(card).toBeLessThan(emi);
    });
});

describe('getRefundEligibility', () => {
    function makeBookingInFuture(hoursAhead) {
        const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
        const dateStr = target.toISOString().split('T')[0];
        const hh = String(target.getUTCHours()).padStart(2, '0');
        const mm = String(target.getUTCMinutes()).padStart(2, '0');
        return { bookingDate: new Date(dateStr), startTime: `${hh}:${mm}` };
    }

    it('gives 100% refund for bookings 24h+ away', () => {
        const { bookingDate, startTime } = makeBookingInFuture(48);
        const r = getRefundEligibility(bookingDate, startTime);
        expect(r.eligible).toBe(true);
        expect(r.percentage).toBe(100);
    });

    it('gives partial (50%) refund for 12–24h before', () => {
        const { bookingDate, startTime } = makeBookingInFuture(18);
        const r = getRefundEligibility(bookingDate, startTime);
        expect(r.eligible).toBe(true);
        expect(r.percentage).toBe(50);
    });

    it('refuses refund for past bookings', () => {
        const { bookingDate, startTime } = makeBookingInFuture(-2);
        const r = getRefundEligibility(bookingDate, startTime);
        expect(r.eligible).toBe(false);
        expect(r.percentage).toBe(0);
    });
});

describe('generateOrderId', () => {
    it('builds an uppercase ID containing the booking id tail', () => {
        const id = generateOrderId('cm123456abcdef');
        expect(id.startsWith('ORDER_')).toBe(true);
        expect(id).toMatch(/^ORDER_[A-Z0-9]+_[0-9]+_[A-Z0-9]+$/);
        // last 8 of the booking id appears in the order id
        expect(id).toContain('56ABCDEF');
    });

    it('produces unique IDs for the same input', () => {
        const seen = new Set();
        for (let i = 0; i < 50; i++) seen.add(generateOrderId('abc12345'));
        expect(seen.size).toBeGreaterThan(40);
    });
});
