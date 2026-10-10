import { getRequestEvent, query } from '$app/server';
import { z } from 'zod';
import * as people from '#lib/server/services/people.ts';

/** 'n Publieke profiel. Geen aanmelding nodig nie; die service besluit wat sigbaar is. */
export const getPublicProfile = query(z.string().min(1).max(64), async (userId) => {
	const viewer = getRequestEvent().locals.user;
	return people.getPublicProfile(userId, viewer?.id ?? null);
});
