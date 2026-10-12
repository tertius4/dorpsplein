import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { saveListingSchema, type SaveListingInput } from '#lib/schemas/listing.ts';
import { createPrisma } from '../db/create.ts';
import { MAX_OPEN_LISTINGS, cancelListing, completeListing, saveListing } from './listings.ts';

const PREFIX = 'test25-';
const owner = PREFIX + 'owner';
const other = PREFIX + 'other';
const blocked = PREFIX + 'blocked';
const newcomer = PREFIX + 'newcomer';

describe.skipIf(!process.env.DATABASE_URL)('plasings (Neon dev)', () => {
	const db = createPrisma(process.env.DATABASE_URL!);
	let categoryId: number;
	const cleanup = () => db.user.deleteMany({ where: { id: { startsWith: PREFIX } } });

	const input = (o: Record<string, unknown> = {}): SaveListingInput =>
		saveListingSchema.parse({
			requestId: crypto.randomUUID(),
			categoryId: String(categoryId),
			title: 'Tuinwerk',
			capacity: '2',
			jobType: 'ODD_JOB',
			...o
		});

	const user = (id: string, o: { consent?: boolean; blocked?: boolean } = {}) =>
		db.user.create({
			data: {
				id,
				name: id,
				email: `${id}@voorbeeld.test`,
				profile: {
					create: {
						popiaConsentAt: o.consent === false ? null : new Date(),
						blocked: o.blocked ?? false
					}
				}
			}
		});

	beforeAll(async () => {
		await cleanup();
		categoryId = (await db.category.findFirstOrThrow({ where: { kind: 'JOB', active: true } })).id;
		await Promise.all([
			user(owner),
			user(other),
			user(blocked, { blocked: true }),
			user(newcomer, { consent: false })
		]);
	}, 60_000);

	afterAll(async () => {
		await cleanup();
		await db.$disconnect();
	}, 30_000);

	it('skep die plasing met sy werk-detail', async () => {
		const { id } = await saveListing(owner, input(), db);
		const row = await db.listing.findUniqueOrThrow({ where: { id }, include: { job: true } });
		expect(row).toMatchObject({ ownerId: owner, status: 'OPEN', capacity: 2 });
		expect(row.job).toMatchObject({ jobType: 'ODD_JOB' });
	}, 30_000);

	it('skep net een plasing vir dieselfde requestId', async () => {
		const i = input({ title: 'Dubbel' });
		const [a, b] = await Promise.all([saveListing(owner, i, db), saveListing(owner, i, db)]);
		expect(a.id).toBe(b.id);
		expect(await db.listing.count({ where: { ownerId: owner, title: 'Dubbel' } })).toBe(1);
	}, 30_000);

	it('weier geblokkeerde en onopgestelde lede', async () => {
		await expect(saveListing(blocked, input(), db)).rejects.toMatchObject({ status: 403 });
		await expect(saveListing(newcomer, input(), db)).rejects.toMatchObject({ status: 403 });
	}, 30_000);

	it('weier ’n onbekende kategorie', async () => {
		await expect(saveListing(other, input({ categoryId: '999999' }), db)).rejects.toMatchObject({
			status: 400
		});
	}, 30_000);

	it('wysig net die eienaar se oop plasing', async () => {
		const { id } = await saveListing(other, input({ title: 'Eerste' }), db);

		await saveListing(other, input({ id, title: 'Tweede', jobType: 'SEASONAL' }), db);
		const row = await db.listing.findUniqueOrThrow({ where: { id }, include: { job: true } });
		expect(row.title).toBe('Tweede');
		expect(row.job?.jobType).toBe('SEASONAL');

		await expect(saveListing(owner, input({ id }), db)).rejects.toMatchObject({ status: 404 });

		await cancelListing(other, id, crypto.randomUUID(), db);
		await expect(saveListing(other, input({ id }), db)).rejects.toMatchObject({ status: 409 });
	}, 60_000);

	it('kanselleer en voltooi net eie oop plasings, net een keer', async () => {
		const { id } = await saveListing(owner, input(), db);

		await expect(cancelListing(other, id, crypto.randomUUID(), db)).rejects.toMatchObject({
			status: 404
		});

		const requestId = crypto.randomUUID();
		await cancelListing(owner, id, requestId, db);
		await cancelListing(owner, id, requestId, db); // herhaling: dieselfde antwoord
		expect((await db.listing.findUniqueOrThrow({ where: { id } })).status).toBe('CANCELLED');

		await expect(completeListing(owner, id, crypto.randomUUID(), db)).rejects.toMatchObject({
			status: 409
		});
	}, 60_000);

	it('staan hoogstens MAX_OPEN_LISTINGS oop plasings toe, ook gelyktydig', async () => {
		const you = PREFIX + 'limit';
		await user(you);
		await db.listing.createMany({
			data: Array.from({ length: MAX_OPEN_LISTINGS - 1 }, () => ({
				kind: 'JOB' as const,
				ownerId: you,
				categoryId,
				title: 'Bestaande plasing'
			}))
		});

		// Net plek vir een: van twee gelyktydige pogings mag presies een slaag.
		const attempts = await Promise.allSettled([
			saveListing(you, input(), db),
			saveListing(you, input(), db)
		]);
		expect(attempts.filter((a) => a.status === 'fulfilled')).toHaveLength(1);
		expect(attempts.find((a) => a.status === 'rejected')).toMatchObject({
			reason: { status: 400 }
		});
		expect(await db.listing.count({ where: { ownerId: you, status: 'OPEN' } })).toBe(
			MAX_OPEN_LISTINGS
		);
	}, 60_000);
});
