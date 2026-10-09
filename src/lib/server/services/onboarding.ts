import type { OnboardingInput } from '#lib/schemas/onboarding.ts';
import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { DB } from '../db/index.ts';

const ONBOARDED_COOKIE = 'dp_onboarded';

export async function completeOnboarding(userId: string, input: OnboardingInput) {
	// Die bladsy wys net aktiewe kategorieë. Enigiets anders is gepeuter.
	const active = new Set((await DB.category.findActive('JOB')).map((c) => c.id));
	if (!input.categoryIds.every((id) => active.has(id))) error(400, 'Ongeldige kategorie');

	await DB.$transaction(async (tx) => {
		await DB.profile.upsert(
			userId,
			{ phone: input.phone, headline: input.headline || null, popiaConsentAt: new Date() },
			tx
		);
		await DB.interest.replaceForUser(userId, input.categoryIds, tx);
		await DB.jobTypePreference.replaceForUser(userId, input.jobTypes, tx);
		await DB.workerProfile.upsert(
			userId,
			{ driversLicence: input.driversLicence ?? false, ownTransport: input.ownTransport ?? false },
			tx
		);
	});

	markOnboarded(userId);
}

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
