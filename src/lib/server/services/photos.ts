import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { auth } from '../auth.ts';
import { DB } from '../db/index.ts';
import { photoBucket } from '../storage.ts';
import { runInBackground } from '../background.ts';

export const MAX_PHOTO_BYTES = 1024 * 1024; // 1 MB; die blaaier stuur gewoonlik ±40 KB

const TYPES = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png'
} as const;
type ImageType = keyof typeof TYPES;

/** Sleutels wat ons self uitdeel: profiles/<userId>/<uuid>.<ext>. Enigiets anders bestaan nie. */
export const PHOTO_KEY = /^profiles\/[A-Za-z0-9_-]{1,64}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

/**
 * Die werklike tipe aan die eerste bytes ("magic bytes"). Die blaaier se MIME-tipe en
 * lêernaam word nie vertrou nie: 'n .txt hernoem na .webp is steeds teks.
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
	const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
	if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png';
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
	return null;
}

/** Die URL vir 'n foto: eie opgelaaide foto, anders die Google-foto, anders niks (voorletters). */
export function photoUrl(photoKey: string | null | undefined, fallback: string | null | undefined) {
	if (photoKey) return `/foto/${photoKey}`;
	return fallback ?? null;
}

/**
 * Sit die foto-URL ook op Better Auth se `User.image`. Dan is dit deel van die sessie
 * (cookieCache) en kan die kopstrook dit wys sonder 'n DB-navraag per bladsy.
 * Prys: 'n Google-foto wat hierdeur oorskryf is, kom nie terug ná "Verwyder" nie.
 */
async function syncSessionImage(image: string | null) {
	await auth().api.updateUser({ body: { image }, headers: getRequestEvent().request.headers });
}

/** Laai 'n profielfoto op en gee die nuwe URL terug. */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
	if (file.size === 0) error(400, 'Die lêer is leeg');
	if (file.size > MAX_PHOTO_BYTES) error(400, 'Die foto is te groot (hoogstens 1 MB)');

	const bytes = new Uint8Array(await file.arrayBuffer());
	const type = detectImageType(bytes);
	if (!type) error(400, 'Net JPEG-, PNG- of WebP-foto’s word aanvaar');

	const key = `profiles/${userId}/${crypto.randomUUID()}.${TYPES[type]}`;
	await photoBucket().put(key, bytes, { httpMetadata: { contentType: type } });

	const previous = (await DB.profile.findByUserId(userId))?.photoKey;
	await DB.profile.update(userId, { photoKey: key });
	const url = photoUrl(key, null)!;
	await syncSessionImage(url);

	// Eers ná die databasis die nuwe sleutel ken, word die ou foto uitgevee.
	if (previous) runInBackground(photoBucket().delete(previous));
	return url;
}

export async function removeProfilePhoto(userId: string) {
	const previous = (await DB.profile.findByUserId(userId))?.photoKey;
	if (!previous) return;
	await DB.profile.update(userId, { photoKey: null });
	await syncSessionImage(null);
	runInBackground(photoBucket().delete(previous));
}
