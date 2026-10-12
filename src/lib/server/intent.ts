import { getRequestEvent } from '$app/server';

/**
 * Wat die nuwe gebruiker op die voorblad gekies het ("Ek soek werk" / "Ek soek mense").
 * 'n Koekie, want die keuse moet die registrasie, e-posverifikasie en Google oorleef.
 * Dit is 'n UX-wenk vir /begin, nie data nie: dit word nie gestoor nie.
 */
export const INTENTS = ['werker', 'plaser'] as const;
export type Intent = (typeof INTENTS)[number];

const COOKIE = 'dp_intent';

export function isIntent(value: unknown): value is Intent {
	return INTENTS.includes(value as Intent);
}

export function setIntent(intent: Intent) {
	getRequestEvent().cookies.set(COOKIE, intent, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7
	});
}

export function readIntent(): Intent | null {
	const value = getRequestEvent().cookies.get(COOKIE);
	return isIntent(value) ? value : null;
}

export function clearIntent() {
	getRequestEvent().cookies.delete(COOKIE, { path: '/' });
}
