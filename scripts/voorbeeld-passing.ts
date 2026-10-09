// Eksperiment: maak toetsmense, kyk wie by 'n werk pas, ruim op.
// Loop met: node --env-file=.env scripts/run.mjs scripts/voorbeeld-passing.ts
import { createPrisma } from '../src/lib/server/db/create.ts';

const db = createPrisma(process.env.DATABASE_URL!);
const TEST_DOMAIN = '@voorbeeld.test';

const konstruksie = await db.category.findFirstOrThrow({
	where: { kind: 'JOB', name: 'Konstruksie' }
});
const tuin = await db.category.findFirstOrThrow({ where: { kind: 'JOB', name: 'Tuin' } });

// Geneste skryf: een oproep skep die gebruiker EN al sy verwante rye, in een transaksie
async function person(
	name: string,
	data: {
		categories: number[];
		jobTypes: ('ODD_JOB' | 'SEASONAL' | 'PERMANENT')[];
		licence?: boolean;
		available?: boolean;
	}
) {
	return db.user.create({
		data: {
			id: crypto.randomUUID(),
			name,
			email: `${name.toLowerCase().replace(/\s/g, '.')}${TEST_DOMAIN}`,
			emailVerified: true,
			profile: { create: { popiaConsentAt: new Date(), available: data.available ?? true } },
			workerProfile: { create: { driversLicence: data.licence ?? false } },
			interests: { create: data.categories.map((categoryId) => ({ categoryId })) },
			jobTypePrefs: { create: data.jobTypes.map((jobType) => ({ jobType })) }
		}
	});
}

await person('Piet Messelaar', {
	categories: [konstruksie.id],
	jobTypes: ['ODD_JOB', 'SEASONAL'],
	licence: true
});
await person('Sarel Seisoen', { categories: [konstruksie.id, tuin.id], jobTypes: ['SEASONAL'] });
await person('Anna Tuin', { categories: [tuin.id], jobTypes: ['ODD_JOB'] });
await person('Koos Vakansie', {
	categories: [konstruksie.id],
	jobTypes: ['ODD_JOB'],
	available: false
});

// Die passing-navraag uit PLAN.md §5: "'n los takie in Konstruksie, rybewys nodig"
const matches = await db.user.findMany({
	where: {
		profile: { available: true, blocked: false, popiaConsentAt: { not: null } },
		interests: { some: { categoryId: konstruksie.id } },
		jobTypePrefs: { some: { jobType: 'ODD_JOB' } },
		workerProfile: { driversLicence: true }
	},
	select: { name: true }
});
console.log(
	'Pas by die werk:',
	matches.map((m) => m.name)
);

// Hoe lyk een volledige profiel?
const piet = await db.user.findFirst({
	where: { email: { startsWith: 'piet.' } },
	include: {
		profile: true,
		workerProfile: true,
		interests: { include: { category: true } },
		jobTypePrefs: true
	}
});
console.dir(piet, { depth: 4 });

// Opruim: een deleteMany op User, en CASCADE vee al die res uit
const { count } = await db.user.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } });
console.log(`🧹 ${count} toetsmense uitgevee`);
await db.$disconnect();
