import { query } from '$app/server';
import { requireUser } from '#lib/server/guards.ts';
import * as opportunities from '#lib/server/services/opportunities.ts';

/** Oop plasings van ander mense; dié wat pas eerste. 'n Enkele plasing: `getListing` in `listings.remote.ts`. */
export const getOpportunities = query(async () => {
	const user = requireUser();
	return opportunities.getOpportunities(user.id);
});
