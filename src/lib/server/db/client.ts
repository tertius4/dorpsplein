import { getRequestEvent } from '$app/server';
import { DATABASE_URL } from '$app/env/private';
import { createPrisma } from './create.ts';
import type { Database, Transaction } from './create.ts';
import type { RequestEvent } from '@sveltejs/kit';

const clients = new WeakMap<RequestEvent, Database>();

export function prisma(): Database {
	const event = getRequestEvent();
	let client = clients.get(event);
	if (!client) {
		client = createPrisma(DATABASE_URL);
		clients.set(event, client);
	}

	return client;
}
