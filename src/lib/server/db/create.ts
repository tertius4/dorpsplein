import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/client';

export function createPrisma(connectionString: string | undefined) {
	if (!connectionString) throw new Error('No connectionString received');

	return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}
