import { clientIp, RULES, TOO_MANY_ATTEMPTS, withinLimit } from '#lib/server/rate-limit.ts';
import { signInSchema, signUpSchema } from '#lib/schemas/auth.ts';
import { form, getRequestEvent, query } from '$app/server';
import { safeRedirect } from '#lib/server/http.ts';
import { invalid, redirect } from '@sveltejs/kit';
import { isAPIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';

/** Only return what the UI needs. */
export const getCurrentUser = query(async () => {
	const { user } = getRequestEvent().locals;
	return user ? { id: user.id, name: user.name } : null;
});

export const signUp = form(signUpSchema, async ({ name, email, _password }) => {
	const isSignUpWithinLimit = await withinLimit(`sign-up:ip:${clientIp()}`, RULES.signUpIp);
	if (!isSignUpWithinLimit) invalid(TOO_MANY_ATTEMPTS);

	await auth().api.signUpEmail({
		body: { name, email, password: _password, callbackURL: '/e-pos-bevestig' },
		headers: getRequestEvent().request.headers
	});
	redirect(303, '/registreer/kyk-jou-e-pos');
});

export const signIn = form(signInSchema, async ({ email, _password, redirect_to }) => {
	const isSignInIpWithinLimit = await withinLimit(`sign-in:ip:${clientIp()}`, RULES.signInIp);
	const isSignInEmailWithinLimit = await withinLimit(`sign-in:email:${email}`, RULES.signInEmail);
	const allowed = isSignInIpWithinLimit && isSignInEmailWithinLimit;
	if (!allowed) invalid(TOO_MANY_ATTEMPTS);

	try {
		await auth().api.signInEmail({
			body: { email, password: _password },
			headers: getRequestEvent().request.headers
		});
	} catch (e) {
		if (isAPIError(e) && e.body?.code === 'INVALID_EMAIL_OR_PASSWORD') {
			invalid('E-pos of wagwoord is verkeerd.');
		}
		if (isAPIError(e) && e.body?.code === 'EMAIL_NOT_VERIFIED') {
			invalid(
				'Jou e-pos is nog nie bevestig nie. Ons het ’n nuwe skakel gestuur; kyk in jou inkassie (en spam).'
			);
		}
		throw e;
	}
	redirect(303, safeRedirect(redirect_to));
});

export const signOut = form(async () => {
	await auth().api.signOut({ headers: getRequestEvent().request.headers });
	redirect(303, '/');
});
