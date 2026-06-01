import { describe, it, expect } from 'vitest';
import { facilityValidation, validateRequest } from '@/validations/facility.validation';
import { ownerResponseSchema } from '@/validations/review.validation';
import { deactivateAccountSchema } from '@/validations/user.validation';

describe('createFacility validation', () => {
    const valid = {
        name: 'Champion Sports Arena',
        description: 'A nice arena',
        address: '123 Main Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        latitude: 12.97,
        longitude: 77.59,
    };

    it('accepts a fully-populated facility', () => {
        const r = validateRequest(valid, facilityValidation.createFacility);
        expect(r.isValid).toBe(true);
        expect(r.data.name).toBe('Champion Sports Arena');
    });

    it('accepts null latitude/longitude (regression: previously 500ed)', () => {
        const r = validateRequest({ ...valid, latitude: null, longitude: null }, facilityValidation.createFacility);
        expect(r.isValid).toBe(true);
    });

    it('rejects a 4-digit pincode', () => {
        const r = validateRequest({ ...valid, pincode: '1234' }, facilityValidation.createFacility);
        expect(r.isValid).toBe(false);
        expect(r.errors.join(' ')).toMatch(/pincode/i);
    });

    it('rejects a too-short name', () => {
        const r = validateRequest({ ...valid, name: 'AB' }, facilityValidation.createFacility);
        expect(r.isValid).toBe(false);
    });
});

describe('owner review response', () => {
    it('accepts short replies like "Thanks!"', () => {
        const r = ownerResponseSchema.safeParse({ response: 'Thanks!' });
        expect(r.success).toBe(true);
    });

    it('rejects empty replies', () => {
        const r = ownerResponseSchema.safeParse({ response: '' });
        expect(r.success).toBe(false);
    });

    it('rejects > 1000 characters', () => {
        const r = ownerResponseSchema.safeParse({ response: 'a'.repeat(1001) });
        expect(r.success).toBe(false);
    });
});

describe('account deactivation schema', () => {
    it('requires a password', () => {
        const r = deactivateAccountSchema.safeParse({ reason: 'leaving' });
        expect(r.success).toBe(false);
    });

    it('accepts password with optional reason', () => {
        const r = deactivateAccountSchema.safeParse({ password: 'TestPass123!' });
        expect(r.success).toBe(true);
    });

    it('rejects an empty password', () => {
        const r = deactivateAccountSchema.safeParse({ password: '' });
        expect(r.success).toBe(false);
    });
});
