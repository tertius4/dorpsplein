import { z } from 'zod';
import { headline, jobTypes, saCellphone } from './fields.ts';

const consentGiven = (d: { popiaConsent?: boolean }) => d.popiaConsent === true;
const consentIssue = { message: 'Jy moet instem om voort te gaan', path: ['popiaConsent'] };

/** Iemand wat werk soek: wil kennisgewings kry, dus kategorieë en werktipes. */
export const workerOnboardingSchema = z
	.object({
		phone: saCellphone,
		headline,
		categoryIds: z
			.array(z.string().regex(/^\d+$/), { error: 'Kies minstens een kategorie' })
			.min(1, 'Kies minstens een kategorie')
			.transform((ids) => [...new Set(ids.map(Number))]),
		jobTypes,
		popiaConsent: z.boolean().optional()
	})
	.refine(consentGiven, consentIssue);

/** Iemand wat mense soek: net 'n selnommer (vir ná aanvaarding) en toestemming. */
export const posterOnboardingSchema = z
	.object({
		phone: saCellphone,
		popiaConsent: z.boolean().optional()
	})
	.refine(consentGiven, consentIssue);

export type WorkerOnboardingInput = z.output<typeof workerOnboardingSchema>;
export type PosterOnboardingInput = z.output<typeof posterOnboardingSchema>;
