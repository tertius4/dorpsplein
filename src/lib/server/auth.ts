import { betterAuth } from 'better-auth';
import { BETTER_AUTH_URL, APP_ENV } from '$app/env/public';
import { BETTER_AUTH_SECRET } from '$app/env/private';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db/client';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import type { Database } from './db/create';

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

		emailAndPassword: {
			enabled: true,
			minPasswordLength: 8
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
			ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] }
		},

		// sveltekitCookies must be the last plugin
		plugins: [sveltekitCookies(getRequestEvent)]
	});
}

let instance: ReturnType<typeof createAuth> | undefined;

export const auth = () => (instance ??= createAuth());
