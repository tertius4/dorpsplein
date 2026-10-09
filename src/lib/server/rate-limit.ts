import { getRequestEvent } from '$app/server';
import { DB } from './db/index.ts';

type Rule = { max: number; windowSeconds: number };

export const RULES = {
	signInEmail: { max: 5, windowSeconds: 15 * 60 },
	signInIp: { max: 20, windowSeconds: 15 * 60 },
	signUpIp: { max: 5, windowSeconds: 60 * 60 },
	forgotPasswordEmail: { max: 3, windowSeconds: 60 * 60 },
	forgotPasswordIp: { max: 10, windowSeconds: 60 * 60 }
} satisfies Record<string, Rule>;

export function clientIp() {
	const event = getRequestEvent();
	return event.request.headers.get('cf-connecting-ip') ?? event.getClientAddress();
}

/** Count 1 @returns {Promise<boolean>} false if rate limit is hit. */
export async function withinLimit(key: string, rule: Rule): Promise<boolean> {
	const count = await DB.rateLimit.hit(`app:${key}`, rule.windowSeconds);
	return count <= rule.max;
}

export const TOO_MANY_ATTEMPTS = 'Te veel pogings. Wag ’n rukkie en probeer dan weer.';
