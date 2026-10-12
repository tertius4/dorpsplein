import type { z } from 'zod';
import type { JobType, ListingKind, Prisma } from '../../db/index.ts';
import type { Transaction } from '../../db/create.ts';

/** Wat 'n lid se profiel sê wat hy wil doen, soos `matchFilter` dit in SQL lees. */
export interface MemberPreferences {
	jobTypes: JobType[];
}

/** Alles wat van 'n soort plasing afhang. Die res van die kode is soort-agnosties. */
export interface KindModule<Details> {
	kind: ListingKind;
	/** Valideer die soort-spesifieke velde. */
	detailsSchema: z.ZodType<Details>;
	createDetails(tx: Transaction, listingId: string, details: Details): Promise<void>;
	updateDetails(tx: Transaction, listingId: string, details: Details): Promise<void>;
	/** Ekstra passing-reëls bo-op die basis (sien `matching.ts`). */
	matchFilter(details: Details): Prisma.UserWhereInput;
	/**
	 * Dieselfde reël as `matchFilter`, maar vir een bekende lid in die geheue ("Pas by jou" op
	 * /geleenthede). Hou die twee ooreenstemmend; `job.spec.ts` toets dit.
	 */
	matchesPreferences(details: Details, prefs: MemberPreferences): boolean;
	label: { singular: string; plural: string; respond: string };
}
