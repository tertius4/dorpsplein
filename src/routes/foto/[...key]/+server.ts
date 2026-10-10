import { error } from '@sveltejs/kit';
import { PHOTO_KEY } from '#lib/server/services/photos.ts';
import { photoBucket } from '#lib/server/storage.ts';
import type { RequestHandler } from './$types';

/** Bedien foto's uit R2. Elke oplaai kry 'n nuwe sleutel, dus kan die blaaier dit vir altyd kas. */
export const GET: RequestHandler = async ({ params }) => {
	if (!PHOTO_KEY.test(params.key)) error(404, 'Foto nie gevind nie');

	const object = await photoBucket().get(params.key);
	if (!object) error(404, 'Foto nie gevind nie');

	return new Response(object.body, {
		headers: {
			'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff',
			ETag: object.httpEtag
		}
	});
};
