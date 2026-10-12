import { jobDetailsSchema, type JobDetailsInput } from '#lib/schemas/listing.ts';
import type { JobType } from '../../db/index.ts';
import type { KindModule } from './types.ts';

/** Afrikaanse name vir die werktipes. `Record<JobType, …>` dwing af dat elkeen 'n naam het. */
export const JOB_TYPE_LABELS: Record<JobType, string> = {
	PERMANENT: 'Permanente pos',
	PART_TIME: 'Deeltyds',
	ODD_JOB: 'Los takies',
	SEASONAL: 'Seisoenwerk'
};

export const jobKind = {
	kind: 'JOB',
	detailsSchema: jobDetailsSchema,

	createDetails: async (tx, listingId, d) => {
		await tx.jobDetails.create({
			data: {
				listingId,
				jobType: d.jobType,
				requiresDriversLicence: d.requiresDriversLicence ?? false
			}
		});
	},

	updateDetails: async (tx, listingId, d) => {
		await tx.jobDetails.update({
			where: { listingId },
			data: { jobType: d.jobType, requiresDriversLicence: d.requiresDriversLicence ?? false }
		});
	},

	matchFilter: (d) => ({
		jobTypePrefs: { some: { jobType: d.jobType } },
		...(d.requiresDriversLicence && { workerProfile: { is: { driversLicence: true } } })
	}),

	label: { singular: 'Werk', plural: 'Werk', respond: 'Ek is beskikbaar' }
} satisfies KindModule<JobDetailsInput>;
