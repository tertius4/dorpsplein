import { describe, expect, it } from 'vitest';
import { jobKind } from './job.ts';

describe('jobKind.matchFilter', () => {
	it('vereis die werktipe-voorkeur', () => {
		expect(jobKind.matchFilter({ jobType: 'ODD_JOB' })).toEqual({
			jobTypePrefs: { some: { jobType: 'ODD_JOB' } }
		});
	});

	it('vereis ’n rybewys net as die plasing dit vra', () => {
		expect(jobKind.matchFilter({ jobType: 'PERMANENT', requiresDriversLicence: true })).toEqual({
			jobTypePrefs: { some: { jobType: 'PERMANENT' } },
			workerProfile: { is: { driversLicence: true } }
		});
		expect(
			jobKind.matchFilter({ jobType: 'PERMANENT', requiresDriversLicence: false })
		).not.toHaveProperty('workerProfile');
	});
});
