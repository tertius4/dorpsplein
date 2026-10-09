import { prisma } from './client.ts';
import type { Db } from './create.ts';

export const interest = {
	findByUser: (userId: string, db: Db = prisma()) =>
		db.interest.findMany({ where: { userId }, include: { category: true } }),

	/** Maak die gebruiker se belangstellings presies `categoryIds`. Bestaande rye (en hul jare ervaring) bly. */
	replaceForUser: async (userId: string, categoryIds: number[], db: Db = prisma()) => {
		await db.interest.deleteMany({ where: { userId, categoryId: { notIn: categoryIds } } });
		await db.interest.createMany({
			data: categoryIds.map((categoryId) => ({ userId, categoryId })),
			skipDuplicates: true
		});
	}
};
