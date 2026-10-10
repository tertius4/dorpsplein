import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';

/** Die aangemelde gebruiker, of 'n 401. Vir remote functions wat aanmelding vereis. */
export function requireUser() {
	const { user } = getRequestEvent().locals;
	if (!user) error(401, 'Meld eers aan');
	return user;
}
