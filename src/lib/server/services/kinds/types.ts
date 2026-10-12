import type { z } from 'zod';
import type { ListingKind, Prisma } from '../../db/index.ts';
import type { Transaction } from '../../db/create.ts';

/** Alles wat van 'n soort plasing afhang. Die res van die kode is soort-agnosties. */
export interface KindModule<Details> {
	kind: ListingKind;
	/** Valideer die soort-spesifieke velde. */
	detailsSchema: z.ZodType<Details>;
	createDetails(tx: Transaction, listingId: string, details: Details): Promise<void>;
	updateDetails(tx: Transaction, listingId: string, details: Details): Promise<void>;
	/** Ekstra passing-reëls bo-op die basis (sien `matching.ts`). */
	matchFilter(details: Details): Prisma.UserWhereInput;
	label: { singular: string; plural: string; respond: string };
}
