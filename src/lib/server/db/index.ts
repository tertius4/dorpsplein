import { category } from './category.ts';
import { prisma } from './client.ts';
import type { Database, Transaction } from './create.ts';
import { interest } from './interest.ts';
import { jobTypePreference } from './job-type-preferences.ts';
import { listing } from './listing.ts';
import { processedRequest } from './processed-request.ts';
import { profile } from './profile.ts';
import { qualification } from './qualification.ts';
import { rateLimit } from './rate-limit.ts';
import { user } from './user.ts';

export const DB = {
	category,
	interest,
	jobTypePreference,
	listing,
	processedRequest,
	profile,
	qualification,
	rateLimit,
	user,

	$transaction: <T>(fn: (tx: Transaction) => Promise<T>, client: Database = prisma()) =>
		client.$transaction(fn)
};

export type * from './generated/client.ts';
export * from './generated/enums.ts';
