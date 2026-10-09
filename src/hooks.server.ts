import type { HandleServerError } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { auth } from '#lib/server/auth.ts';
import { building } from '$app/env';
import { redirect } from '@sveltejs/kit';

/** Bladsye net vir mense wat nie aangemeld is nie. */
const GUEST_ONLY = new Set(['/teken-in', '/registreer']);

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth().api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	if (event.locals.user && GUEST_ONLY.has(event.url.pathname)) redirect(303, '/');

	return svelteKitHandler({ event, resolve, auth: auth(), building });
};

export const handleError: HandleServerError = ({ kind, error, event }) => {
	// App-, raamwerk- (bv. 404) en validasiefoute het reeds 'n veilige boodskap.
	if (kind !== 'unknown') return;

	console.error(`[${event.request.method} ${event.url.pathname}]`, error);
	return { message: 'Iets het verkeerd geloop' };
};
