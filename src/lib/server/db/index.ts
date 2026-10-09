import { category } from './category.ts';
import { prisma } from './client.ts';
import type { Transaction } from './create.ts';
import { rateLimit } from './rate-limit.ts';

export const DB = {
	category,
	rateLimit,

	$transaction: <T>(fn: (tx: Transaction) => Promise<T>) => prisma().$transaction(fn)
};

export type * from './generated/client.ts';
export * from './generated/enums.ts';
