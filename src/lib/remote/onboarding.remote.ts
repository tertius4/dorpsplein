import { form, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { DB } from '#lib/server/db/index.ts';
import { requireUser } from '#lib/server/guards.ts';
import { JOB_TYPE_LABELS } from '#lib/server/services/kinds/job.ts';
import * as onboarding from '#lib/server/services/onboarding.ts';
import { JOB_TYPES } from '#lib/schemas/fields.ts';
import { posterOnboardingSchema, workerOnboardingSchema } from '#lib/schemas/onboarding.ts';

/** Alles wat die werker se /begin moet wys, reeds in Afrikaans. */
export const getOnboardingOptions = query(async () => {
	requireUser();
	const categories = await DB.category.findActive('JOB');
	return {
		categories: categories.map(({ id, name, icon }) => ({ id: String(id), name, icon })),
		jobTypes: JOB_TYPES.map((value) => ({ value, label: JOB_TYPE_LABELS[value] }))
	};
});

export const completeWorkerOnboarding = form(workerOnboardingSchema, async (input) => {
	const user = requireUser();
	await onboarding.completeWorkerOnboarding(user.id, input);
	redirect(303, '/tuis');
});

export const completePosterOnboarding = form(posterOnboardingSchema, async (input) => {
	const user = requireUser();
	await onboarding.completePosterOnboarding(user.id, input);
	redirect(303, '/plasings/nuut');
});
