import { clientIp, RULES, TOO_MANY_ATTEMPTS, withinLimit } from '#lib/server/rate-limit.ts';
import {
	forgotPasswordSchema,
	resetPasswordSchema,
	signInSchema,
	signUpSchema
} from '#lib/schemas/auth.ts';
import { form, getRequestEvent, query } from '$app/server';
import { safeRedirect } from '#lib/server/http.ts';
import { error, invalid, redirect } from '@sveltejs/kit';
import { isAPIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import { z } from 'zod';

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

export const forgotPassword = form(forgotPasswordSchema, async ({ email }) => {
	const ipOk = await withinLimit(`forgot-password:ip:${clientIp()}`, RULES.forgotPasswordIp);
	const emailOk = await withinLimit(`forgot-password:email:${email}`, RULES.forgotPasswordEmail);
	if (!ipOk || !emailOk) invalid(TOO_MANY_ATTEMPTS);

	await auth().api.requestPasswordReset({
		body: { email, redirectTo: '/wagwoord-herstel' },
		headers: getRequestEvent().request.headers
	});
	return { sent: true };
});

export const resetPassword = form(resetPasswordSchema, async ({ token, _password }) => {
	try {
		await auth().api.resetPassword({
			body: { token, newPassword: _password },
			headers: getRequestEvent().request.headers
		});
	} catch (e) {
		if (isAPIError(e) && e.body?.code === 'INVALID_TOKEN') {
			invalid('Die skakel het verval of is reeds gebruik. Vra ’n nuwe een aan.');
		}
		throw e;
	}
	redirect(303, '/teken-in?herstel=klaar');
});

export const signInWithGoogle = form(
	z.object({ redirect_to: z.string().optional() }),
	async ({ redirect_to }) => {
		const { url } = await auth().api.signInSocial({
			body: {
				provider: 'google',
				callbackURL: safeRedirect(redirect_to),
				errorCallbackURL: '/teken-in',
				disableRedirect: true
			},
			headers: getRequestEvent().request.headers
		});

		if (!url) error(500, 'Kon nie na Google stuur nie');

		redirect(303, url, { external: true });
	}
);
