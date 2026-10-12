import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createPrisma } from './db/create.ts';
import { withRequestId as run } from './idempotency.ts';

const PREFIX = 'test24-';
const userA = PREFIX + 'a';
const userB = PREFIX + 'b';

describe.skipIf(!process.env.DATABASE_URL)('withRequestId (Neon dev)', () => {
	const db = createPrisma(process.env.DATABASE_URL!);
	const cleanup = () => db.user.deleteMany({ where: { id: { startsWith: PREFIX } } });
	const id = () => crypto.randomUUID();
	const withRequestId: typeof run = (u, r, a, fn) => run(u, r, a, fn, db);

	beforeAll(async () => {
		await cleanup();
		await db.user.createMany({
			data: [userA, userB].map((u) => ({ id: u, name: u, email: `${u}@voorbeeld.test` }))
		});
	}, 60_000);

	afterAll(async () => {
		await cleanup();
		await db.$disconnect();
	}, 30_000);

	it('voer fn een keer uit en herhaal die gestoorde antwoord', async () => {
		const requestId = id();
		const fn = vi.fn(async () => ({ id: 'abc' }));

		const first = await withRequestId(userA, requestId, 'test.create', fn);
		const second = await withRequestId(userA, requestId, 'test.create', fn);

		expect(first).toEqual({ result: { id: 'abc' }, replayed: false });
		expect(second).toEqual({ result: { id: 'abc' }, replayed: true });
		expect(fn).toHaveBeenCalledTimes(1);
	}, 30_000);

	it('sit ’n void-antwoord om in null', async () => {
		const requestId = id();
		await withRequestId(userA, requestId, 'test.void', async () => {});
		const again = await withRequestId(userA, requestId, 'test.void', async () => {});
		expect(again).toEqual({ result: null, replayed: true });
	}, 30_000);

	it('rol terug as fn faal, en laat ’n herpoging toe', async () => {
		const requestId = id();
		const boom = withRequestId(userA, requestId, 'test.fail', async (tx) => {
			await tx.user.create({
				data: { id: PREFIX + 'rolled', name: 'x', email: `${PREFIX}rolled@voorbeeld.test` }
			});
			throw new Error('boem');
		});
		await expect(boom).rejects.toThrow('boem');

		expect(await db.processedRequest.findUnique({ where: { requestId } })).toBeNull();
		expect(await db.user.findUnique({ where: { id: PREFIX + 'rolled' } })).toBeNull();

		const retry = await withRequestId(userA, requestId, 'test.fail', async () => ({ ok: true }));
		expect(retry).toEqual({ result: { ok: true }, replayed: false });
	}, 30_000);

	it('voer fn net een keer uit by twee gelyktydige versoeke', async () => {
		const requestId = id();
		const fn = vi.fn(async () => ({ n: 1 }));

		const [a, b] = await Promise.all([
			withRequestId(userA, requestId, 'test.race', fn),
			withRequestId(userA, requestId, 'test.race', fn)
		]);

		expect(fn).toHaveBeenCalledTimes(1);
		expect(a.result).toEqual({ n: 1 });
		expect(b.result).toEqual({ n: 1 });
		expect([a.replayed, b.replayed].sort()).toEqual([false, true]);
	}, 30_000);

	it('gee 409 vir ’n ander gebruiker of ’n ander aksie', async () => {
		const requestId = id();
		await withRequestId(userA, requestId, 'test.owner', async () => ({ secret: 1 }));

		await expect(
			withRequestId(userB, requestId, 'test.owner', async () => ({ x: 1 }))
		).rejects.toMatchObject({ status: 409 });
		await expect(
			withRequestId(userA, requestId, 'test.other', async () => ({ x: 1 }))
		).rejects.toMatchObject({ status: 409 });
	}, 30_000);
});
