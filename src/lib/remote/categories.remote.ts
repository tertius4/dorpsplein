import { DB, ListingKind } from '#lib/server/db/index.ts';
import { query } from '$app/server';
import { z } from 'zod';

export const getCategories = query(z.enum(ListingKind), _getCategories);
async function _getCategories(kind: ListingKind) {
	const categories = await DB.category.findActive(kind);
	return categories.map(({ id, name, icon }) => ({ id, name, icon }));
}
