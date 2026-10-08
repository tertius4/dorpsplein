import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: "node scripts/run.mjs prisma/seed.ts"
	},
	datasource: {
		// For prisma migrations (non pooled connections)
		url: process.env.DIRECT_URL
	}
});
