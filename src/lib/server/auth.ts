import { GOOGLE_CLIENT_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth';
import { GOOGLE_CLIENT_ID, BETTER_AUTH_URL, APP_ENV } from '$app/env/public';
import { BETTER_AUTH_SECRET } from '$app/env/private';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db/client';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import type { Database } from './db/create';
import { runInBackground } from './background';
import { sendEmail } from './email';
import { accountExists, passwordChanged, resetPassword, verifyEmail } from './emails';

const requestPrisma = new Proxy({} as Database, {
	get(_, prop) {
		const client = prisma();
		const value = Reflect.get(client, prop, client);
		return typeof value === 'function' ? value.bind(client) : value;
	}
});

function createAuth() {
	return betterAuth({
		baseURL: BETTER_AUTH_URL,
		secret: BETTER_AUTH_SECRET,
		database: prismaAdapter(requestPrisma, { provider: 'postgresql' }),

		socialProviders: {
			google: {
				clientId: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				prompt: 'select_account'
			}
		},

		account: {
			encryptOAuthTokens: true
		},

		emailAndPassword: {
			enabled: true,
			minPasswordLength: 8,
			requireEmailVerification: true,
			onExistingUserSignUp: async ({ user }) => {
				runInBackground(
					sendEmail({
						to: user.email,
						...accountExists({
							name: user.name,
							signInUrl: `${BETTER_AUTH_URL}/teken-in`,
							resetUrl: `${BETTER_AUTH_URL}/wagwoord-vergeet`
						})
					})
				);
			},
			resetPasswordTokenExpiresIn: 60 * 60, // 1 uur
			revokeSessionsOnPasswordReset: true,
			sendResetPassword: async ({ user, url }) => {
				await sendEmail({ to: user.email, ...resetPassword({ name: user.name, url }) });
			},
			onPasswordReset: async ({ user }) => {
				runInBackground(
					sendEmail({
						to: user.email,
						...passwordChanged({ name: user.name, resetUrl: `${BETTER_AUTH_URL}/wagwoord-vergeet` })
					})
				);
			}
		},

		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true, // ongeverifieerd aanmeld → stuur weer 'n skakel
			autoSignInAfterVerification: true,
			expiresIn: 60 * 60 * 24, // 24 uur
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmail({ to: user.email, ...verifyEmail({ name: user.name, url }) });
			}
		},
		session: {
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24, // extend at least once a day.
			cookieCache: { enabled: true, maxAge: 5 * 60 } // 5 min sonder DB-navraag
		},

		rateLimit: {
			enabled: APP_ENV !== 'local',
			storage: 'database'
		},

		advanced: {
			// Cloudflare gee die regte kliënt-IP in hierdie header
			ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
			backgroundTasks: { handler: runInBackground }
		},

		// sveltekitCookies must be the last plugin
		plugins: [sveltekitCookies(getRequestEvent)]
	});
}

let instance: ReturnType<typeof createAuth> | undefined;

export const auth = () => (instance ??= createAuth());
