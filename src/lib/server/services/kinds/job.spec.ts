import { describe, expect, it } from 'vitest';
import { jobKind } from './job.ts';

describe('jobKind.matchFilter', () => {
	it('vereis die werktipe-voorkeur', () => {
		expect(jobKind.matchFilter({ jobType: 'ODD_JOB' })).toEqual({
			jobTypePrefs: { some: { jobType: 'ODD_JOB' } }
		});
	});
});
