import { prisma } from './client.ts';
import type { ListingKind, Prisma } from './generated/client.ts';

export const category = {
	findMany: (args?: Prisma.CategoryFindManyArgs) => prisma().category.findMany(args),
	findById: (id: number) => prisma().category.findUnique({ where: { id } }),
	create: (data: Prisma.CategoryCreateInput) => prisma().category.create({ data }),
	update: (id: number, data: Prisma.CategoryUpdateInput) =>
		prisma().category.update({ where: { id }, data }),
	findActive: (kind: ListingKind) =>
		prisma().category.findMany({
			where: { kind, active: true },
			orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
		})
};
