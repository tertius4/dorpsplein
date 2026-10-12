import { describe, expect, it } from 'vitest';
import { listingBaseSchema } from './listing.ts';

const valid = { categoryId: '3', title: 'Hulp in die tuin', capacity: '2' };

describe('listingBaseSchema', () => {
	it('aanvaar minimum velde en maak leë opsionele velde null', () => {
		const r = listingBaseSchema.parse({ ...valid, description: '  ', price: '', endsAt: '' });
		expect(r).toMatchObject({
			categoryId: 3,
			capacity: 2,
			description: null,
			price: null,
			location: null,
			startsAt: null,
			endsAt: null,
			closesAt: null
		});
	});

	it('trim die titel en verwerp te kort titels', () => {
		expect(listingBaseSchema.parse({ ...valid, title: '  Tuinwerk ' }).title).toBe('Tuinwerk');
		expect(listingBaseSchema.safeParse({ ...valid, title: ' ab ' }).success).toBe(false);
	});

	it('verwerp kapasiteit buite 1–50 en nie-heelgetalle', () => {
		for (const capacity of ['0', '51', '1.5', 'x']) {
			expect(listingBaseSchema.safeParse({ ...valid, capacity }).success).toBe(false);
		}
	});

	it('verwerp ’n ongeldige kategorie', () => {
		expect(listingBaseSchema.safeParse({ ...valid, categoryId: '' }).success).toBe(false);
	});

	it('verwerp endsAt voor startsAt, met die fout op endsAt', () => {
		const r = listingBaseSchema.safeParse({
			...valid,
			startsAt: '2026-11-10',
			endsAt: '2026-11-09'
		});
		expect(r.success).toBe(false);
		expect(r.error?.issues[0].path).toEqual(['endsAt']);
	});

	it('aanvaar endsAt gelyk aan of ná startsAt', () => {
		const r = listingBaseSchema.safeParse({
			...valid,
			startsAt: '2026-11-10',
			endsAt: '2026-11-10'
		});
		expect(r.success).toBe(true);
	});
});

describe('datums', () => {
	it('verwerp ’n ongeldige datum', () => {
		expect(listingBaseSchema.safeParse({ ...valid, closesAt: 'môre' }).success).toBe(false);
	});
});
