import { prisma } from './client.ts';
import type { Db } from './create.ts';
import type { Prisma } from './generated/client.ts';

export const profile = {
	findByUserId: (userId: string, db: Db = prisma()) => db.profile.findUnique({ where: { userId } }),

	/**
	 * PRIVAATHEID: die enigste plek wat selnommers in grootmaat gelees word. Die service roep dit
	 * net aan vir mense met 'n `ACCEPTED`-reaksie tussen die twee partye.
	 */
	findPhones: async (userIds: string[], db: Db = prisma()) => {
		const rows = await db.profile.findMany({
			where: { userId: { in: userIds } },
			select: { userId: true, phone: true }
		});
		return new Map(rows.map((r) => [r.userId, r.phone]));
	},

	upsert: (
		userId: string,
		data: Omit<Prisma.ProfileUncheckedCreateInput, 'userId'>,
		db: Db = prisma()
	) => db.profile.upsert({ where: { userId }, create: { userId, ...data }, update: data }),

	update: (userId: string, data: Prisma.ProfileUpdateInput, db: Db = prisma()) =>
		db.profile.update({ where: { userId }, data }),

	/** Het die gebruiker /begin voltooi (POPIA-toestemming gegee)? */
	isOnboarded: async (userId: string) =>
		(await prisma().profile.count({ where: { userId, popiaConsentAt: { not: null } } })) > 0
};
