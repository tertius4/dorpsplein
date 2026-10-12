import { z } from 'zod';
import { JOB_TYPES } from './fields.ts';

/** Opsionele teks: leë of ontbrekende waarde word `null`. */
const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Hoogstens ${max} karakters`)
		.optional()
		.transform((v) => v || null);

/** Opsionele datum: leë of ontbrekende waarde word `null`. */
const optionalDate = z
	.string()
	.trim()
	.optional()
	.transform((v, ctx) => {
		if (!v) return null;
		const date = new Date(v);
		if (Number.isNaN(date.getTime())) {
			ctx.issues.push({ code: 'custom', message: 'Gebruik ’n geldige datum', input: v });
			return z.NEVER;
		}
		return date;
	});

export const listingBaseSchema = z
	.object({
		categoryId: z
			.string({ error: 'Kies ’n kategorie' })
			.regex(/^\d+$/, 'Kies ’n kategorie')
			.transform(Number),
		title: z.string().trim().min(3, 'Minstens 3 karakters').max(100, 'Hoogstens 100 karakters'),
		description: optionalText(2000),
		price: optionalText(100),
		location: optionalText(120),
		capacity: z.coerce
			.number({ error: 'Gebruik ’n getal' })
			.int('Gebruik ’n heelgetal')
			.min(1, 'Minstens 1')
			.max(50, 'Hoogstens 50'),
		startsAt: optionalDate,
		endsAt: optionalDate,
		closesAt: optionalDate
	})
	.refine((d) => !d.startsAt || !d.endsAt || d.endsAt >= d.startsAt, {
		message: 'Die einddatum kan nie voor die begindatum wees nie',
		path: ['endsAt']
	});

export const jobDetailsSchema = z.object({
	jobType: z.enum(JOB_TYPES, { error: 'Kies die tipe werk' }),
	requiresDriversLicence: z.boolean().optional()
});

export type ListingBase = z.output<typeof listingBaseSchema>;
export type JobDetailsInput = z.output<typeof jobDetailsSchema>;
