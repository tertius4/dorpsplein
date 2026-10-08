import { getRequestEvent } from '$app/server';
import { DATABASE_URL } from '$app/env/private';
import { createPrisma } from './create.ts';
import type { PrismaClient } from './generated/client';
import type { RequestEvent } from '@sveltejs/kit';

const clients = new WeakMap<RequestEvent, PrismaClient>();

export function prisma(): PrismaClient {
	const event = getRequestEvent();
	let client = clients.get(event);
	if (!client) {
		client = createPrisma(DATABASE_URL);
		clients.set(event, client);
	}

	return client;
}
