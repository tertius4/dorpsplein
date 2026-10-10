import { env } from 'cloudflare:workers';

/**
 * Die R2-emmer vir foto's (`PHOTOS` in wrangler.jsonc; plaaslik nageboots deur Wrangler).
 * LET WEL: adapter-cloudflare 8 gee nie `event.platform` deur nie. Bindings kom uit
 * `cloudflare:workers`, wat die adapter in `npm run dev` naboots.
 */
export function photoBucket(): R2Bucket {
	const bucket = env.PHOTOS;
	if (!bucket) throw new Error('R2-binding PHOTOS ontbreek (kyk wrangler.jsonc)');
	return bucket;
}
