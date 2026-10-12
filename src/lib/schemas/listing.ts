import { z } from 'zod';
import { JOB_TYPES, requestId } from './fields.ts';

/** Opsionele teks: leë of ontbrekende waarde word `null`. */
export const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Hoogstens ${max} karakters`)
		.optional()
		.transform((v) => v || null);

/**
 * Opsionele datum uit `<input type="date">` ("2026-11-10"), as Orania-tyd (Suid-Afrika het geen
 * somertyd nie, dus altyd +02:00). `endOfDay`: "laaste dag"-velde duur tot einde van daardie dag.
 */
const optionalDate = (endOfDay = false) =>
	z
		.string()
		.trim()
		.optional()
		.transform((v, ctx) => {
			if (!v) return null;
			const date = /^\d{4}-\d{2}-\d{2}$/.test(v)
				? new Date(`${v}T${endOfDay ? '23:59:59' : '00:00:00'}+02:00`)
				: new Date(NaN);
			if (Number.isNaN(date.getTime())) {
				ctx.issues.push({ code: 'custom', message: 'Gebruik ’n geldige datum', input: v });
				return z.NEVER;
			}
			return date;
		});

const listingBaseFields = {
	categoryId: z
		.string({ error: 'Kies ’n kategorie' })
		.regex(/^\d+$/, 'Kies ’n kategorie')
		.transform(Number),
	title: z.string().trim().min(3, 'Minstens 3 karakters').max(100, 'Hoogstens 100 karakters'),
	description: optionalText(2000),
	price: optionalText(100),
	location: optionalText(120),
	// `z.coerce` het `unknown` as invoer, wat remote forms nie aanvaar nie.
	capacity: z
		.string({ error: 'Gebruik ’n getal' })
		.trim()
		.regex(/^\d+$/, 'Gebruik ’n heelgetal')
		.transform(Number)
		.pipe(z.number().min(1, 'Minstens 1').max(50, 'Hoogstens 50')),
	startsAt: optionalDate(),
	endsAt: optionalDate(),
	closesAt: optionalDate(true)
};

const datesInOrder = (d: { startsAt: Date | null; endsAt: Date | null }) =>
	!d.startsAt || !d.endsAt || d.endsAt >= d.startsAt;
const datesInOrderIssue = {
	message: 'Die einddatum kan nie voor die begindatum wees nie',
	path: ['endsAt']
};

export const listingBaseSchema = z
	.object(listingBaseFields)
	.refine(datesInOrder, datesInOrderIssue);

export const jobDetailsSchema = z.object({
	jobType: z.enum(JOB_TYPES, { error: 'Kies die tipe werk' })
});

/** Die plasing-vorm: `id` leeg = nuwe plasing, anders wysig dit daardie plasing. */
export const saveListingSchema = z
	.object({
		requestId,
		id: z.string().max(64).optional(),
		...listingBaseFields,
		...jobDetailsSchema.shape
	})
	.refine(datesInOrder, datesInOrderIssue);

/** Wat die plasing-vorm vir die regstreekse "± N mense"-skatting stuur. */
export const estimateSchema = z.object({
	categoryId: z.number().int().positive(),
	jobType: jobDetailsSchema.shape.jobType
});

export const listingActionSchema = z.object({ requestId, id: z.string().min(1).max(64) });

export type SaveListingInput = z.output<typeof saveListingSchema>;
export type ListingBase = z.output<typeof listingBaseSchema>;
export type JobDetailsInput = z.output<typeof jobDetailsSchema>;
