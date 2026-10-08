import { getRequestEvent } from '$app/server';
import config from '#lib/server/config.ts';
import { createPrisma } from './create';
import type { PrismaClient } from './generated/client';
import type { RequestEvent } from '@sveltejs/kit';

type Event = RequestEvent<Record<string, never>, '/' | null>;
const clients = new WeakMap<Event, PrismaClient>();

export function prisma(): PrismaClient {
	const event = getRequestEvent();
	let client = clients.get(event);
	if (!client) {
		client = createPrisma(config.database_url);
		clients.set(event, client);
	}

	return client;
}
