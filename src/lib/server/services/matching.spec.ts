import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { JobType } from '../db/index.ts';
import { createPrisma } from '../db/create.ts';
import { buildMatchWhere, estimateRecipients, type MatchInput } from './matching.ts';

const PREFIX = 'test23-';

describe.skipIf(!process.env.DATABASE_URL)('passing (Neon dev)', () => {
	const db = createPrisma(process.env.DATABASE_URL!);
	let konstruksie: number;
	let tuin: number;

	const cleanup = () => db.user.deleteMany({ where: { id: { startsWith: PREFIX } } });

	function person(
		key: string,
		o: {
			categories: number[];
			jobTypes: JobType[];
			available?: boolean;
			blocked?: boolean;
			consent?: boolean;
		}
	) {
		return db.user.create({
			data: {
				id: PREFIX + key,
				name: key,
				email: `${PREFIX}${key}@voorbeeld.test`,
				emailVerified: true,
				profile: {
					create: {
						popiaConsentAt: o.consent === false ? null : new Date(),
						available: o.available ?? true,
						blocked: o.blocked ?? false
					}
				},
				interests: { create: o.categories.map((categoryId) => ({ categoryId })) },
				jobTypePrefs: { create: o.jobTypes.map((jobType) => ({ jobType })) }
			}
		});
	}

	beforeAll(async () => {
		await cleanup();
		const find = (name: string) =>
			db.category.findFirstOrThrow({ where: { kind: 'JOB', name } }).then((c) => c.id);
		[konstruksie, tuin] = await Promise.all([find('Konstruksie'), find('Tuin')]);

		await Promise.all([
			person('pas', { categories: [konstruksie], jobTypes: ['ODD_JOB'] }),
			person('anderKategorie', { categories: [tuin], jobTypes: ['ODD_JOB'] }),
			person('anderTipe', { categories: [konstruksie], jobTypes: ['SEASONAL'] }),
			person('nietBeskikbaar', {
				categories: [konstruksie],
				jobTypes: ['ODD_JOB'],
				available: false
			}),
			person('geblokkeer', {
				categories: [konstruksie],
				jobTypes: ['ODD_JOB'],
				blocked: true
			}),
			person('geenToestemming', {
				categories: [konstruksie],
				jobTypes: ['ODD_JOB'],
				consent: false
			}),
			person('plaser', { categories: [konstruksie], jobTypes: ['ODD_JOB'] })
		]);
	}, 60_000);

	afterAll(async () => {
		await cleanup();
		await db.$disconnect();
	}, 30_000);

	const input = (o: Partial<MatchInput> = {}): MatchInput => ({
		kind: 'JOB',
		categoryId: konstruksie,
		ownerId: PREFIX + 'iemandAnders',
		details: { jobType: 'ODD_JOB' },
		...o
	});

	/** Net ons eie toetsmense; jou ware dev-gebruikers kan ook pas. */
	const matched = async (i: MatchInput) =>
		(
			await db.user.findMany({
				where: { AND: [buildMatchWhere(i), { id: { startsWith: PREFIX } }] },
				select: { id: true }
			})
		)
			.map((u) => u.id.slice(PREFIX.length))
			.sort();

	it('pas by kategorie en werktipe', async () => {
		expect(await matched(input())).toEqual(['pas', 'plaser']);
	});

	it('pas net by die kategorie van die plasing', async () => {
		expect(await matched(input({ categoryId: tuin }))).toEqual(['anderKategorie']);
	});

	it('pas net by die werktipe van die plasing', async () => {
		expect(await matched(input({ details: { jobType: 'SEASONAL' } }))).toEqual(['anderTipe']);
	});

	it('sluit nie-beskikbaar, geblokkeer en onopgestelde mense uit', async () => {
		const found = await matched(input());
		for (const out of ['nietBeskikbaar', 'geblokkeer', 'geenToestemming']) {
			expect(found).not.toContain(out);
		}
	});

	it('sluit die plaser self uit', async () => {
		expect(await matched(input({ ownerId: PREFIX + 'plaser' }))).toEqual(['pas']);
	});

	it('estimateRecipients tel minstens ons toetsmense', async () => {
		expect(await estimateRecipients(input(), db)).toBeGreaterThanOrEqual(2);
	});
});
