import { z } from 'zod';
import type { JobType } from '#lib/server/db/index.ts';

export const JOB_TYPES = [
	'PERMANENT',
	'PART_TIME',
	'ODD_JOB',
	'SEASONAL'
] as const satisfies readonly JobType[];

/** SA selnommer: "082 123 4567" of "+27 82 123 4567" → "+27821234567" (E.164). */
export const saCellphone = z
	.string()
	.transform((v) => v.replace(/[\s()-]/g, ''))
	.pipe(z.string().regex(/^(?:\+27|0)[6-8]\d{8}$/, 'Gebruik ’n SA selnommer, bv. 082 123 4567'))
	.transform((v) => (v.startsWith('0') ? `+27${v.slice(1)}` : v));

export const headline = z.string().trim().max(80, 'Hoogstens 80 karakters').optional();

export const jobTypes = z
	.array(z.enum(JOB_TYPES), { error: 'Kies minstens een tipe werk' })
	.min(1, 'Kies minstens een tipe werk');
