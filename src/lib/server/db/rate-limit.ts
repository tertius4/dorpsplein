import { prisma } from './client.ts';

export const rateLimit = {
	/**
	 * Tel een treffer vir `key` in 'n vaste venster en gee die telling in die
	 * huidige venster terug. Een SQL-stelling, dus veilig as versoeke gelyktydig kom.
	 * (`lastRequest` hou hier die begin van die venster.)
	 */
	async hit(key: string, windowSeconds: number): Promise<number> {
		const now = BigInt(Date.now());
		const windowStart = now - BigInt(windowSeconds * 1000);

		const [row] = await prisma().$queryRaw<{ count: number }[]>`
			INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest")
			VALUES (${crypto.randomUUID()}, ${key}, 1, ${now})
			ON CONFLICT ("key") DO UPDATE SET
				"count" = CASE WHEN "RateLimit"."lastRequest" < ${windowStart}
					THEN 1 ELSE "RateLimit"."count" + 1 END,
				"lastRequest" = CASE WHEN "RateLimit"."lastRequest" < ${windowStart}
					THEN ${now} ELSE "RateLimit"."lastRequest" END
			RETURNING "count"`;

		return row.count;
	}
};
