import { form, getRequestEvent, query } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { isAPIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import { signInSchema, signUpSchema } from '#lib/schemas/auth.ts';
import { safeRedirect } from '#lib/server/http.ts';

/** Die aangemelde gebruiker (net wat die UI nodig het), of null. */
export const getCurrentUser = query(async () => {
	const { user } = getRequestEvent().locals;
	return user ? { id: user.id, name: user.name } : null;
});

export const signUp = form(signUpSchema, async ({ name, email, _password }, issue) => {
	try {
		await auth().api.signUpEmail({
			body: { name, email, password: _password },
			headers: getRequestEvent().request.headers
		});
	} catch (e) {
		if (isAPIError(e) && e.body?.code?.startsWith('USER_ALREADY_EXISTS')) {
			invalid(issue.email('Daar is reeds ’n rekening met hierdie e-pos. Meld eerder aan.'));
		}
		throw e;
	}
	redirect(303, '/');
});

export const signIn = form(signInSchema, async ({ email, _password, redirect_to }) => {
	try {
		await auth().api.signInEmail({
			body: { email, password: _password },
			headers: getRequestEvent().request.headers
		});
	} catch (e) {
		if (isAPIError(e) && e.body?.code === 'INVALID_EMAIL_OR_PASSWORD') {
			invalid('E-pos of wagwoord is verkeerd.');
		}
		throw e;
	}
	redirect(303, safeRedirect(redirect_to));
});

export const signOut = form(async () => {
	await auth().api.signOut({ headers: getRequestEvent().request.headers });
	redirect(303, '/');
});
