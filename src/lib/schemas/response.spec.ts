import { describe, expect, it } from 'vitest';
import { respondSchema, responseActionSchema } from './response.ts';

const requestId = crypto.randomUUID();

describe('respondSchema', () => {
	it('maak ’n leë nota null', () => {
		const r = respondSchema.parse({ requestId, listingId: 'abc', note: '   ' });
		expect(r.note).toBeNull();
	});

	it('aanvaar ’n ontbrekende nota', () => {
		expect(respondSchema.parse({ requestId, listingId: 'abc' }).note).toBeNull();
	});

	it('weier ’n nota langer as 300 karakters', () => {
		expect(
			respondSchema.safeParse({ requestId, listingId: 'abc', note: 'x'.repeat(301) }).success
		).toBe(false);
	});

	it('weier ’n ongeldige requestId of leë plasing-id', () => {
		expect(respondSchema.safeParse({ requestId: 'nee', listingId: 'abc' }).success).toBe(false);
		expect(respondSchema.safeParse({ requestId, listingId: '' }).success).toBe(false);
	});
});

describe('responseActionSchema', () => {
	it('vereis ’n id en ’n requestId', () => {
		expect(responseActionSchema.safeParse({ requestId, id: 'r1' }).success).toBe(true);
		expect(responseActionSchema.safeParse({ id: 'r1' }).success).toBe(false);
	});
});
