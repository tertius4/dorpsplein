import { isOnboarded } from '#lib/server/services/onboarding.ts';
import type { HandleServerError } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { auth } from '#lib/server/auth.ts';
import { building } from '$app/env';
import { redirect, type RequestEvent } from '@sveltejs/kit';

function routeGroup(routeId: string | null) {
	return routeId?.match(/^\/\(([^)]+)\)/)?.[1] ?? null;
}

async function guard(event: RequestEvent) {
	if (event.isRemoteRequest) return; // remote functions beskerm hulself (requireUser)

	const { user } = event.locals;
	const group = routeGroup(event.route.id);
	const signIn = `/teken-in?na=${encodeURIComponent(event.url.pathname + event.url.search)}`;

	if (event.route.id === '/' && user) redirect(303, '/tuis');
	if (group === 'guest' && user) redirect(303, '/tuis');

	if (group === 'onboarding' || group === 'app') {
		if (!user) redirect(303, signIn);
		const onboarded = await isOnboarded(user.id);
		if (group === 'app' && !onboarded) redirect(303, '/begin');
		if (group === 'onboarding' && onboarded) redirect(303, '/tuis');
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth().api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	await guard(event);

	return svelteKitHandler({ event, resolve, auth: auth(), building });
};

export const handleError: HandleServerError = ({ kind, error, event }) => {
	// App-, raamwerk- (bv. 404) en validasiefoute het reeds 'n veilige boodskap.
	if (kind !== 'unknown') return;

	console.error(`[${event.request.method} ${event.url.pathname}]`, error);
	return { message: 'Iets het verkeerd geloop' };
};
