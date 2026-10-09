import { prisma } from './client.ts';
import type { Db } from './create.ts';

export const workerProfile = {
	findByUser: (userId: string, db: Db = prisma()) =>
		db.workerProfile.findUnique({ where: { userId } }),

	upsert: (
		userId: string,
		data: { driversLicence: boolean; ownTransport: boolean },
		db: Db = prisma()
	) => db.workerProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data })
};
