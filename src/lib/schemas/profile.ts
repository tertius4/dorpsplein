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
export const publicProfileSchema = z.boolean();

export const qualificationSchema = z.object({
	name: z.string().trim().min(2, 'Vul die kwalifikasie in').max(120, 'Hoogstens 120 karakters'),
	issuer: z.string().trim().max(120, 'Hoogstens 120 karakters').optional(),
	year: z
		.string()
		.trim()
		.regex(/^(\d{4})?$/, 'Gebruik ’n jaartal, bv. 2019')
		.refine(
			(v) => !v || (Number(v) >= 1950 && Number(v) <= new Date().getFullYear()),
			'Tussen 1950 en vanjaar'
		)
		.optional()
});

export const qualificationIdSchema = z.string().min(1).max(40);

export type InterestsInput = z.output<typeof interestsSchema>;
export type QualificationInput = z.output<typeof qualificationSchema>;
