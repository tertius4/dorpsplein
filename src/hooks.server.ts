import type { HandleServerError } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { auth } from '#lib/server/auth.ts';
import { building } from '$app/env';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth().api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	return svelteKitHandler({ event, resolve, auth: auth(), building });
};

export const handleError: HandleServerError = ({ kind, error, event }) => {
	// App-, raamwerk- (bv. 404) en validasiefoute het reeds 'n veilige boodskap.
	if (kind !== 'unknown') return;

	console.error(`[${event.request.method} ${event.url.pathname}]`, error);
	return { message: 'Iets het verkeerd geloop' };
};
