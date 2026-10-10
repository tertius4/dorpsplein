import { prisma } from './client.ts';
import type { Db } from './create.ts';

export const qualification = {
	findByUser: (userId: string, db: Db = prisma()) =>
		db.qualification.findMany({
			where: { userId },
			orderBy: [{ year: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
		}),

	countByUser: (userId: string, db: Db = prisma()) => db.qualification.count({ where: { userId } }),

	create: (
		userId: string,
		data: { name: string; issuer: string | null; year: number | null },
		db: Db = prisma()
	) => db.qualification.create({ data: { userId, ...data } }),

	/**
	 * Vee net uit as die kwalifikasie aan `userId` behoort (keer IDOR).
	 * Gee die aantal uitgeveede rye terug: 0 = bestaan nie, of is nie joune nie.
	 */
	deleteOwned: async (id: string, userId: string, db: Db = prisma()) =>
		(await db.qualification.deleteMany({ where: { id, userId } })).count
};
