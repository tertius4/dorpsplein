import { category } from './category.ts';
import { prisma } from './client.ts';
import type { Transaction } from './create.ts';

export const DB = {
	category,

	$transaction: <T>(fn: (tx: Transaction) => Promise<T>) => prisma().$transaction(fn)
};

export type * from './generated/client.ts';
export * from './generated/enums.ts';
