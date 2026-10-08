import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

const SUFFIX = '.wasm?module';
const PLACEHOLDER = '__PRISMA_WASM_MODULE__';
const OUTPUT_NAME = 'prisma/query_compiler_fast_bg.wasm';

/**
 * Prisma se `workerd`-kliënt laai sy navraag-enjin met `import('./x.wasm?module')`.
 * Wrangler verstaan dit, maar Vite nie:
 * - dev / vitest / skripte (Node): kompileer die WASM self na 'n `WebAssembly.Module`.
 * - bou: kopieer die WASM na die bediener-uitset en hou die invoer ekstern,
 *   sodat Wrangler dit as 'n CompiledWasm-module bundel.
 */
export function prismaWasm(): Plugin {
	let isBuild = false;
	const wasmFiles = new Map<string, string>(); // Vite-omgewing → WASM-lêer

	return {
		name: 'dorpsplein:prisma-wasm',
		enforce: 'pre',

		configResolved(config) {
			isBuild = config.command === 'build';
		},

		resolveId(id, importer) {
			if (!id.endsWith(SUFFIX) || !importer) return;
			const file = path.resolve(path.dirname(importer), id.slice(0, -'?module'.length));
			if (!isBuild) return file + '?module';

			// Bou: onthou die lêer vir hierdie omgewing en los die invoer vir Wrangler
			wasmFiles.set(this.environment.name, file);
			return { id: PLACEHOLDER, external: true };
		},

		async load(id) {
			if (isBuild || !id.endsWith(SUFFIX)) return;
			const b64 = (await readFile(id.slice(0, -'?module'.length))).toString('base64');
			return `export default new WebAssembly.Module(Uint8Array.from(atob(${JSON.stringify(b64)}), (c) => c.charCodeAt(0)));`;
		},

		async generateBundle(_options, bundle) {
			// Net die omgewing wat die WASM werklik ingevoer het (die bediener), nooit die blaaier nie
			const wasmFile = wasmFiles.get(this.environment.name);
			if (!wasmFile) return;

			this.emitFile({ type: 'asset', fileName: OUTPUT_NAME, source: await readFile(wasmFile) });
			for (const chunk of Object.values(bundle)) {
				if (chunk.type !== 'chunk' || !chunk.code.includes(PLACEHOLDER)) continue;
				let rel = path.posix.relative(path.posix.dirname(chunk.fileName), OUTPUT_NAME);
				if (!rel.startsWith('.')) rel = './' + rel;
				chunk.code = chunk.code.replaceAll(PLACEHOLDER, rel + '?module');
			}
		}
	};
}
