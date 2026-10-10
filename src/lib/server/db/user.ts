import { prisma } from './client.ts';

export const user = {
	/**
	 * PRIVAATHEID: die `select` is 'n witlys. E-pos, foon, isAdmin en die res word nooit
	 * uit die databasis gelees nie, so hulle kan ook nie per ongeluk teruggegee word nie.
	 * (`blocked` en `popiaConsentAt` word net vir die sigbaarheidsreëls gelees.)
	 */
	findPublicProfile: (id: string) =>
		prisma().user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				image: true,
				createdAt: true,
				profile: {
					select: {
						headline: true,
						photoKey: true,
						bio: true,
						available: true,
						publicProfile: true,
						// Net vir die sigbaarheidsreëls in services/people.ts; word nie teruggegee nie.
						blocked: true,
						popiaConsentAt: true
					}
				},
				workerProfile: { select: { driversLicence: true, ownTransport: true } },
				interests: {
					where: { category: { active: true } },
					select: { yearsExperience: true, category: { select: { name: true, icon: true } } },
					orderBy: { category: { sortOrder: 'asc' } }
				},
				jobTypePrefs: { select: { jobType: true } },
				qualifications: {
					select: { id: true, name: true, issuer: true, year: true },
					orderBy: [{ year: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
				}
			}
		})
};
