import { error } from '@sveltejs/kit';
import type { Prisma } from './db/index.ts';
import { DB } from './db/index.ts';
import type { Database, Transaction } from './db/create.ts';

/**
 * Voer `fn` hoogstens een keer per `requestId` uit. 'n Herhaling kry die gestoorde antwoord
 * terug en `replayed: true` (bv. sodat kennisgewings nie weer gestuur word nie).
 *
 * Die claim en `fn` loop in één transaksie: gooi `fn` 'n fout, word die claim teruggerol en
 * mag die kliënt weer probeer. Twee gelyktydige versoeke met dieselfde id: die tweede wag
 * by die databasis en sien dan die eerste se antwoord.
 *
 * LET WEL: alle skryfwerk in `fn` moet via `tx` gaan. Wat via die gewone `prisma()` skryf,
 * word nie teruggerol nie. Die antwoord moet JSON-versoenbaar wees (`void` word `null`).
 */
export async function withRequestId<T extends Prisma.InputJsonValue | void>(
	userId: string,
	requestId: string,
	action: string,
	fn: (tx: Transaction) => Promise<T>,
	client?: Database // net vir toetse buite 'n versoek
): Promise<{ result: T; replayed: boolean }> {
	return DB.$transaction(async (tx) => {
		if (await DB.processedRequest.claim(requestId, userId, action, tx)) {
			const result = await fn(tx);
			await DB.processedRequest.saveResult(requestId, result ?? null, tx);
			return { result, replayed: false };
		}

		const existing = await DB.processedRequest.find(requestId, tx);
		// Dieselfde 409 vir 'n ander gebruiker of aksie: ons gee nooit iemand anders se antwoord terug nie.
		if (existing?.userId !== userId || existing.action !== action) {
			error(409, 'Hierdie versoek-ID is reeds vir iets anders gebruik');
		}

		return { result: existing.result as T, replayed: true };
	}, client);
}
