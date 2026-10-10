import { prisma } from './client.ts';
import type { Db } from './create.ts';
import type { Prisma } from './generated/client.ts';

export const profile = {
	findByUserId: (userId: string) => prisma().profile.findUnique({ where: { userId } }),

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
