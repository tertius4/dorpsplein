import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/client';

export function createPrisma(connectionString: string | undefined) {
	if (!connectionString) throw Error("No connectionSting received")

	return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
}
