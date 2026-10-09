import { category } from './category.ts';
import { prisma } from './client.ts';
import type { Transaction } from './create.ts';
import { interest } from './interest.ts';
import { jobTypePreference } from './job-type-preferences.ts';
import { profile } from './profile.ts';
import { rateLimit } from './rate-limit.ts';
import { workerProfile } from './worker-profile.ts';

export const DB = {
	category,
	interest,
	jobTypePreference,
	profile,
	rateLimit,
	workerProfile,

	$transaction: <T>(fn: (tx: Transaction) => Promise<T>) => prisma().$transaction(fn)
};

export type * from './generated/client.ts';
export * from './generated/enums.ts';
