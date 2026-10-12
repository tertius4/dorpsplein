import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { saveListingSchema, type SaveListingInput } from '#lib/schemas/listing.ts';
import { respondSchema } from '#lib/schemas/response.ts';
import { createPrisma } from '../db/create.ts';
import { DB } from '../db/index.ts';
import { completeListing, saveListing } from './listings.ts';
import { acceptResponse, declineResponse, respond, toContact, withdraw } from './responses.ts';

const PREFIX = 'test33-';
const owner = PREFIX + 'owner';
const [r1, r2, r3] = [PREFIX + 'r1', PREFIX + 'r2', PREFIX + 'r3'];
const blocked = PREFIX + 'blocked';
const newcomer = PREFIX + 'newcomer';
const outsider = PREFIX + 'outsider';

describe.skipIf(!process.env.DATABASE_URL)('reaksies (Neon dev)', () => {
	// Neon `dev` is soms stadig: gee die transaksies ruimte sodat die toets die logika toets, nie die latensie nie.
	const db = createPrisma(process.env.DATABASE_URL!, { transactionTimeout: 20_000 });
	let categoryId: number;
	let otherCategoryId: number;
	const cleanup = () => db.user.deleteMany({ where: { id: { startsWith: PREFIX } } });

	const user = (id: string, o: { consent?: boolean; blocked?: boolean; phone?: string } = {}) =>
		db.user.create({
			data: {
				id,
				name: id,
				email: `${id}@voorbeeld.test`,
				profile: {
					create: {
						popiaConsentAt: o.consent === false ? null : new Date(),
						blocked: o.blocked ?? false,
						phone: o.phone
					}
				}
			}
		});

	const listingInput = (o: Record<string, unknown> = {}): SaveListingInput =>
		saveListingSchema.parse({
			requestId: crypto.randomUUID(),
			categoryId: String(categoryId),
			title: 'Tuinwerk',
			capacity: '2',
			jobType: 'ODD_JOB',
			...o
		});

	/**
	 * 'n Plasing vir `owner`. Direk in die databasis, sodat die limiet van oop plasings nie inmeng nie;
	 * elke toets kry sy eie, sodat toetse mekaar nie raak nie.
	 */
	const newListing = async (o: { capacity?: string } = {}) =>
		(
			await db.listing.create({
				data: {
					kind: 'JOB',
					ownerId: owner,
					categoryId,
					title: 'Tuinwerk',
					capacity: Number(o.capacity ?? '2'),
					job: { create: { jobType: 'ODD_JOB' } }
				}
			})
		).id;

	const reply = (userId: string, listingId: string, note?: string) =>
		respond(userId, respondSchema.parse({ requestId: crypto.randomUUID(), listingId, note }), db);

	const accept = (responseId: string) => acceptResponse(owner, responseId, crypto.randomUUID(), db);
	const statusOf = async (id: string) =>
		(await db.response.findUniqueOrThrow({ where: { id } })).status;
	const listingStatus = async (id: string) =>
		(await db.listing.findUniqueOrThrow({ where: { id } })).status;

	beforeAll(async () => {
		await cleanup();
		const categories = await db.category.findMany({
			where: { kind: 'JOB', active: true },
			take: 2
		});
		categoryId = categories[0].id;
		otherCategoryId = categories[1].id;
		await Promise.all([
			user(owner, { phone: '+27821110000' }),
			user(r1, { phone: '+27822220000' }),
			user(r2),
			user(r3),
			user(blocked, { blocked: true }),
			user(newcomer, { consent: false }),
			user(outsider)
		]);
	}, 60_000);

	afterAll(async () => {
		await cleanup();
		await db.$disconnect();
	}, 30_000);

	describe('respond', () => {
		it('skep ’n reaksie met ’n nota, en doen dit net een keer per requestId', async () => {
			const listing = await newListing();
			const input = respondSchema.parse({
				requestId: crypto.randomUUID(),
				listingId: listing,
				note: 'Kan eers 09:00 begin'
			});
			const [a, b] = await Promise.all([respond(r1, input, db), respond(r1, input, db)]);
			expect(a.id).toBe(b.id);
			expect(await db.response.count({ where: { listingId: listing } })).toBe(1);
			expect(await db.response.findUniqueOrThrow({ where: { id: a.id } })).toMatchObject({
				status: 'INTERESTED',
				note: 'Kan eers 09:00 begin',
				responderId: r1
			});
		}, 60_000);

		it('weier ’n tweede reaksie, die eie plasing, en ’n onbekende plasing', async () => {
			const listing = await newListing();
			await reply(r1, listing);
			await expect(reply(r1, listing)).rejects.toMatchObject({ status: 409 });
			await expect(reply(owner, listing)).rejects.toMatchObject({ status: 400 });
			await expect(reply(r1, 'bestaan-nie')).rejects.toMatchObject({ status: 404 });
		}, 60_000);

		it('weier geblokkeerde en onopgestelde lede', async () => {
			const listing = await newListing();
			await expect(reply(blocked, listing)).rejects.toMatchObject({ status: 403 });
			await expect(reply(newcomer, listing)).rejects.toMatchObject({ status: 403 });
		}, 60_000);

		it('weier as die sperdatum verby is of die plasing nie oop is nie', async () => {
			const past = await db.listing.create({
				data: { kind: 'JOB', ownerId: owner, categoryId, title: 'Verby', closesAt: new Date(0) }
			});
			await expect(reply(r1, past.id)).rejects.toMatchObject({ status: 409 });

			const done = await newListing();
			await completeListing(owner, done, crypto.randomUUID(), db);
			await expect(reply(r1, done)).rejects.toMatchObject({ status: 409 });
		}, 60_000);

		it('laat ’n geblokkeerde plaser se plasing ongesien', async () => {
			const theirs = await db.listing.create({
				data: { kind: 'JOB', ownerId: blocked, categoryId, title: 'Geblokkeer' }
			});
			await expect(reply(r1, theirs.id)).rejects.toMatchObject({ status: 404 });
		}, 60_000);
	});

	describe('acceptResponse', () => {
		it('sluit die plasing wanneer dit vol is en wys die res af', async () => {
			const listing = await newListing({ capacity: '2' });
			const [a, b, c] = [
				await reply(r1, listing),
				await reply(r2, listing),
				await reply(r3, listing)
			];

			const first = await accept(a.id);
			expect(first.full).toBe(false);
			expect(await listingStatus(listing)).toBe('OPEN');

			const second = await accept(b.id);
			expect(second.full).toBe(true);
			expect(await listingStatus(listing)).toBe('CLOSED');
			expect(await statusOf(a.id)).toBe('ACCEPTED');
			expect(await statusOf(b.id)).toBe('ACCEPTED');
			expect(await statusOf(c.id)).toBe('DECLINED');

			// Vol: niemand kan meer reageer nie.
			await expect(reply(outsider, listing)).rejects.toMatchObject({ status: 409 });
		}, 90_000);

		it('laat net die eienaar toe, en net een keer', async () => {
			const listing = await newListing();
			const a = await reply(r1, listing);

			await expect(acceptResponse(r2, a.id, crypto.randomUUID(), db)).rejects.toMatchObject({
				status: 404
			});
			await expect(acceptResponse(r1, a.id, crypto.randomUUID(), db)).rejects.toMatchObject({
				status: 404
			});

			await accept(a.id);
			await expect(accept(a.id)).rejects.toMatchObject({ status: 409 });
		}, 60_000);

		it('aanvaar nooit meer as capacity nie, ook nie gelyktydig nie', async () => {
			const listing = await newListing({ capacity: '1' });
			const [a, b] = [await reply(r1, listing), await reply(r2, listing)];

			const attempts = await Promise.allSettled([accept(a.id), accept(b.id)]);
			expect(attempts.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
			expect(attempts.find((x) => x.status === 'rejected')).toMatchObject({
				reason: { status: 409 }
			});
			expect(await db.response.count({ where: { listingId: listing, status: 'ACCEPTED' } })).toBe(
				1
			);
			expect(await listingStatus(listing)).toBe('CLOSED');
		}, 90_000);
	});

	describe('declineResponse', () => {
		it('wys af, en die persoon kan nie weer reageer nie', async () => {
			const listing = await newListing();
			const a = await reply(r1, listing);

			await declineResponse(owner, a.id, crypto.randomUUID(), db);
			expect(await statusOf(a.id)).toBe('DECLINED');
			await expect(reply(r1, listing)).rejects.toMatchObject({ status: 409 });
			await expect(declineResponse(r2, a.id, crypto.randomUUID(), db)).rejects.toMatchObject({
				status: 404
			});
		}, 60_000);
	});

	describe('withdraw', () => {
		it('laat net die reageerder onttrek, en dan weer reageer', async () => {
			const listing = await newListing();
			const a = await reply(r1, listing);

			await expect(withdraw(r2, a.id, crypto.randomUUID(), db)).rejects.toMatchObject({
				status: 404
			});

			await withdraw(r1, a.id, crypto.randomUUID(), db);
			expect(await statusOf(a.id)).toBe('WITHDRAWN');
			await expect(withdraw(r1, a.id, crypto.randomUUID(), db)).rejects.toMatchObject({
				status: 409
			});

			const again = await reply(r1, listing, 'Toe tog');
			expect(again.id).toBe(a.id);
			expect(await db.response.findUniqueOrThrow({ where: { id: a.id } })).toMatchObject({
				status: 'INTERESTED',
				note: 'Toe tog'
			});
		}, 90_000);

		it('maak ’n vol plasing weer oop as ’n aanvaarde persoon onttrek', async () => {
			const listing = await newListing({ capacity: '1' });
			const [a, b] = [await reply(r1, listing), await reply(r2, listing)];
			await accept(a.id);
			expect(await listingStatus(listing)).toBe('CLOSED');
			expect(await statusOf(b.id)).toBe('DECLINED');

			await withdraw(r1, a.id, crypto.randomUUID(), db);
			expect(await listingStatus(listing)).toBe('OPEN');
			expect(await statusOf(b.id)).toBe('DECLINED'); // wie afgewys is, bly afgewys
			await reply(r3, listing); // daar is weer plek
		}, 90_000);

		it('laat nie toe om te onttrek ná die plasing afgehandel is nie', async () => {
			const listing = await newListing({ capacity: '1' });
			const a = await reply(r1, listing);
			await accept(a.id);
			await completeListing(owner, listing, crypto.randomUUID(), db); // vanaf CLOSED
			expect(await listingStatus(listing)).toBe('COMPLETED');

			await expect(withdraw(r1, a.id, crypto.randomUUID(), db)).rejects.toMatchObject({
				status: 409
			});
			expect(await statusOf(a.id)).toBe('ACCEPTED');
		}, 90_000);
	});

	describe('wysig ná reaksies', () => {
		it('sluit kategorie en werktipe, maar laat ander velde toe', async () => {
			const listing = await newListing();
			const edit = (o: Record<string, unknown>) =>
				saveListing(owner, listingInput({ id: listing, ...o }), db);

			await edit({ categoryId: String(otherCategoryId) }); // nog niemand het gereageer nie
			await edit({ categoryId: String(categoryId) });

			await reply(r1, listing);
			await expect(edit({ categoryId: String(otherCategoryId) })).rejects.toMatchObject({
				status: 409
			});
			await expect(edit({ jobType: 'SEASONAL' })).rejects.toMatchObject({ status: 409 });

			await edit({ title: 'Nuwe titel', capacity: '3' });
			expect(await db.listing.findUniqueOrThrow({ where: { id: listing } })).toMatchObject({
				title: 'Nuwe titel',
				capacity: 3,
				categoryId
			});
		}, 120_000);

		it('laat kapasiteit nie tot die aantal aanvaardes of minder daal nie', async () => {
			const listing = await newListing({ capacity: '3' });
			const [a, b] = [await reply(r1, listing), await reply(r2, listing)];
			await accept(a.id);
			await accept(b.id);

			const edit = (capacity: string) =>
				saveListing(owner, listingInput({ id: listing, capacity }), db);
			await expect(edit('2')).rejects.toMatchObject({ status: 400 });
			await edit('3');
		}, 120_000);
	});

	describe('privaatheid', () => {
		it('lees nie die reageerder se foon saam met die reaksielys nie', async () => {
			const listing = await newListing();
			await reply(r1, listing);

			const rows = await DB.response.listForListing(listing, db);
			expect(rows).toHaveLength(1);
			expect(JSON.stringify(rows)).not.toContain('822220000');
			expect(JSON.stringify(rows)).not.toContain('phone');
		}, 60_000);

		it('gee selnommers net vir die gevraagde mense', async () => {
			const phones = await DB.profile.findPhones([r1], db);
			expect(phones.get(r1)).toBe('+27822220000');
			expect(phones.has(r2)).toBe(false);
		}, 30_000);
	});

	describe('toContact', () => {
		it('maak bel- en WhatsApp-skakels uit ’n E.164-nommer', () => {
			expect(toContact('+27821234567')).toEqual({
				phone: '082 123 4567',
				tel: 'tel:+27821234567',
				whatsapp: 'https://wa.me/27821234567'
			});
		});

		it('gee null sonder nommer', () => {
			expect(toContact(null)).toBeNull();
			expect(toContact('')).toBeNull();
		});
	});
});
