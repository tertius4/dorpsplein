import { prisma } from './client.ts';
import { category } from './category.ts';
import type { Prisma } from './generated/client.ts';

export const DB = {
	category,

	$transaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => prisma().$transaction(fn)
};

export type * from './generated/client.ts';
