import { prisma } from './client.ts';
import type { Db } from './create.ts';
import type { JobType } from './generated/client.ts';

export const jobTypePreference = {
	findByUser: (userId: string, db: Db = prisma()) =>
		db.jobTypePreference.findMany({ where: { userId } }),

	/** Maak die gebruiker se werktipes presies `jobTypes`. */
	replaceForUser: async (userId: string, jobTypes: JobType[], db: Db = prisma()) => {
		await db.jobTypePreference.deleteMany({ where: { userId, jobType: { notIn: jobTypes } } });
		await db.jobTypePreference.createMany({
			data: jobTypes.map((jobType) => ({ userId, jobType })),
			skipDuplicates: true
		});
	}
};
