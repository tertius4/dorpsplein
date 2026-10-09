import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from './generated/client.ts';

/** 'n WebSocket-fout terwyl die verbinding oopgemaak word (nog geen navraag gestuur nie). */
function isConnectionError(error: unknown) {
	return typeof Event !== 'undefined' && error instanceof Event && error.type === 'error';
}

/** Skep 'n Prisma-kliënt teen Neon. Geen SvelteKit-afhanklikhede nie, sodat skripte dit ook kan gebruik. */
export function createPrisma(connectionString: string) {
	return new PrismaClient({ adapter: new PrismaNeon({ connectionString }) }).$extends({
		name: 'retry-connection',
		query: {
			async $allOperations({ args, query }) {
				for (let attempt = 1; ; attempt++) {
					try {
						return await query(args);
					} catch (error) {
						if (attempt >= 3 || !isConnectionError(error)) throw error;
						await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
					}
				}
			}
		}
	});
}

/** Ons kliënt-tipe, ná die uitbreiding. */
export type Database = ReturnType<typeof createPrisma>;

/** Die kliënt wat 'n `$transaction`-terugroep kry. */
export type Transaction = Parameters<Parameters<Database['$transaction']>[0]>[0];
