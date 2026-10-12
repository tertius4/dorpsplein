import { prisma } from './client.ts';
import type { Db } from './create.ts';
import { Prisma } from './generated/client.ts';

export const processedRequest = {
	/** Probeer die `requestId` te eien. `false` = dit bestaan reeds (iemand was eerste). */
	claim: async (requestId: string, userId: string, action: string, db: Db = prisma()) => {
		const { count } = await db.processedRequest.createMany({
			data: { requestId, userId, action },
			skipDuplicates: true
		});
		return count === 1;
	},

	find: (requestId: string, db: Db = prisma()) =>
		db.processedRequest.findUnique({ where: { requestId } }),

	saveResult: (requestId: string, result: Prisma.InputJsonValue | null, db: Db = prisma()) =>
		db.processedRequest.update({
			where: { requestId },
			data: { result: result ?? Prisma.JsonNull }
		})
};
