import { z } from 'zod';
import { headline, jobTypes, saCellphone } from './fields.ts';

export const onboardingSchema = z
	.object({
		phone: saCellphone,
		headline,
		categoryIds: z
			.array(z.string().regex(/^\d+$/), { error: 'Kies minstens een kategorie' })
			.min(1, 'Kies minstens een kategorie')
			.transform((ids) => [...new Set(ids.map(Number))]),
		jobTypes,
		driversLicence: z.boolean().optional(),
		ownTransport: z.boolean().optional(),
		popiaConsent: z.boolean().optional()
	})
	.refine((d) => d.popiaConsent === true, {
		message: 'Jy moet instem om voort te gaan',
		path: ['popiaConsent']
	});

export type OnboardingInput = z.output<typeof onboardingSchema>;
