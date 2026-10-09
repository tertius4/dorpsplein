import { getRequestEvent } from '$app/server';
import { DB } from '../db/index.ts';

const ONBOARDED_COOKIE = 'dp_onboarded';

/**
 * Het die gebruiker /begin voltooi? Die antwoord word in 'n koekie gekas.
 * LET WEL: die koekie is 'n UX-wenk, nie 'n sekuriteitskontrole nie. Services wat
 * toestemming vereis (bv. passing), kontroleer `popiaConsentAt` self in die databasis.
 */
export async function isOnboarded(userId: string): Promise<boolean> {
	const { cookies } = getRequestEvent();
	if (cookies.get(ONBOARDED_COOKIE) === userId) return true;

	const onboarded = await DB.profile.isOnboarded(userId);
	if (onboarded) markOnboarded(userId);
	return onboarded;
}

export function markOnboarded(userId: string) {
	getRequestEvent().cookies.set(ONBOARDED_COOKIE, userId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365
	});
}

export function forgetOnboarded() {
	getRequestEvent().cookies.delete(ONBOARDED_COOKIE, { path: '/' });
}