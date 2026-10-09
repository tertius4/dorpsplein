import type { JobType } from '../../db/index.ts';

/** Afrikaanse name vir die werktipes. `Record<JobType, …>` dwing af dat elkeen 'n naam het. */
export const JOB_TYPE_LABELS: Record<JobType, string> = {
	PERMANENT: 'Permanente pos',
	PART_TIME: 'Deeltyds',
	ODD_JOB: 'Los takies',
	SEASONAL: 'Seisoenwerk'
};
