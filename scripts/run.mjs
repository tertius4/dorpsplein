// Voer 'n TypeScript-skrip uit deur Vite, sodat Prisma se WASM-enjin laai.
// Gebruik: node scripts/run.mjs prisma/seed.ts

import { runnerImport } from 'vite';
import { prismaWasm } from '../vite-plugins/prisma-wasm.ts';

const [file] = process.argv.slice(2);
if (!file) {
	console.error('Gebruik: node scripts/run.mjs <lêer.ts>');
	process.exit(1);
}

await runnerImport(new URL(file, `file://${process.cwd()}/`).pathname, {
	configFile: false,
	plugins: [prismaWasm()],
	logLevel: 'warn'
});