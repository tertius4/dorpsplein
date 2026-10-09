import { z } from 'zod';
import { headline, jobTypes, saCellphone } from './fields.ts';

export const aboutSchema = z.object({
	name: z.string().trim().min(2, 'Vul jou naam in').max(80, 'Hoogstens 80 karakters'),
	headline,
	bio: z.string().trim().max(1000, 'Hoogstens 1000 karakters').optional(),
	phone: saCellphone
});

/** Een ry per kategorie: is dit gekies, en hoeveel jaar ervaring? */
export const interestsSchema = z
	.object({
		interests: z.array(
			z.object({
				categoryId: z.string().regex(/^\d+$/),
				selected: z.boolean().optional(),
				years: z
					.string()
					.regex(/^\d{0,2}$/, 'Gebruik ’n getal, bv. 5')
					.optional()
			})
		)
	})
	.transform(({ interests }) =>
		interests
			.filter((i) => i.selected)
			.map((i) => ({
				categoryId: Number(i.categoryId),
				yearsExperience: i.years ? Number(i.years) : null
			}))
	)
	.refine((list) => list.length > 0, 'Kies minstens een kategorie');

export const jobPreferencesSchema = z.object({
	jobTypes,
	driversLicence: z.boolean().optional(),
	ownTransport: z.boolean().optional()
});

export const availabilitySchema = z.boolean();

export type InterestsInput = z.output<typeof interestsSchema>;
