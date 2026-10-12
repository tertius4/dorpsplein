import type { JobDetailsInput } from '#lib/schemas/listing.ts';
import { DB } from '../db/index.ts';
import type { ListingKind, Prisma } from '../db/index.ts';
import type { Db } from '../db/create.ts';
import { kinds } from './kinds/index.ts';

export interface MatchInput {
	kind: ListingKind;
	categoryId: number;
	ownerId: string;
	// Word 'n diskriminerende unie op `kind` sodra daar 'n tweede soort is.
	details: JobDetailsInput;
}

/** Wie moet van 'n plasing hoor? Die basisreëls geld vir almal; die soort voeg sy eie by. */
export function buildMatchWhere(input: MatchInput): Prisma.UserWhereInput {
	const base: Prisma.UserWhereInput = {
		id: { not: input.ownerId },
		profile: { is: { available: true, blocked: false, popiaConsentAt: { not: null } } },
		interests: { some: { categoryId: input.categoryId } }
	};

	return { AND: [base, kinds[input.kind].matchFilter(input.details)] };
}

export const estimateRecipients = (input: MatchInput, db?: Db) =>
	DB.user.countMatching(buildMatchWhere(input), db);
