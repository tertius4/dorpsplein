import { query } from '$app/server';
import { requireUser } from '#lib/server/guards.ts';
import * as home from '#lib/server/services/home.ts';

export const getHome = query(async () => {
	const user = requireUser();
	return home.getHomeOverview(user.id, user);
});
