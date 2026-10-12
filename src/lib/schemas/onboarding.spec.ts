import { describe, expect, it } from 'vitest';
import { posterOnboardingSchema, workerOnboardingSchema } from './onboarding.ts';

const phone = '082 123 4567';

describe('posterOnboardingSchema', () => {
	it('vra net selnommer en toestemming', () => {
		const r = posterOnboardingSchema.parse({ phone, popiaConsent: true });
		expect(r).toEqual({ phone: '+27821234567', popiaConsent: true });
	});

	it('vereis toestemming', () => {
		const r = posterOnboardingSchema.safeParse({ phone });
		expect(r.success).toBe(false);
		expect(r.error?.issues[0].path).toEqual(['popiaConsent']);
	});

	it('verwerp ’n ongeldige selnommer', () => {
		expect(posterOnboardingSchema.safeParse({ phone: '123', popiaConsent: true }).success).toBe(
			false
		);
	});
});

describe('workerOnboardingSchema', () => {
	const worker = { phone, categoryIds: ['4', '4', '6'], jobTypes: ['ODD_JOB'], popiaConsent: true };

	it('aanvaar en ontdubbel kategorieë', () => {
		expect(workerOnboardingSchema.parse(worker).categoryIds).toEqual([4, 6]);
	});

	it('vereis minstens een kategorie en een werktipe', () => {
		expect(workerOnboardingSchema.safeParse({ ...worker, categoryIds: [] }).success).toBe(false);
		expect(workerOnboardingSchema.safeParse({ ...worker, jobTypes: [] }).success).toBe(false);
	});
});
