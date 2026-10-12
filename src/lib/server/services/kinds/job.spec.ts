import { describe, expect, it } from 'vitest';
import { jobKind } from './job.ts';

describe('jobKind.matchFilter', () => {
	it('vereis die werktipe-voorkeur', () => {
		expect(jobKind.matchFilter({ jobType: 'ODD_JOB' })).toEqual({
			jobTypePrefs: { some: { jobType: 'ODD_JOB' } }
		});
	});
});

describe('jobKind.matchesPreferences', () => {
	it('pas net as die werktipe een van die lid se voorkeure is', () => {
		expect(
			jobKind.matchesPreferences({ jobType: 'ODD_JOB' }, { jobTypes: ['ODD_JOB', 'SEASONAL'] })
		).toBe(true);
		expect(jobKind.matchesPreferences({ jobType: 'PERMANENT' }, { jobTypes: ['ODD_JOB'] })).toBe(
			false
		);
		expect(jobKind.matchesPreferences({ jobType: 'PERMANENT' }, { jobTypes: [] })).toBe(false);
	});
});
