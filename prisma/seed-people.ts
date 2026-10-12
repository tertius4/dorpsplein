// Toetsmense en -plasings vir Neon `dev`, sodat passing ("± N mense") iets het om te tel.
// Loop met: npm run db:seed:people   (herhaalbaar: dit vee eers sy eie `seed-`-rye uit)
//
// LET WEL: loop dit net teen `dev`. `.env` wys na `dev`; dit kan nie self onderskei nie, want
// 'n Neon-URL bevat nie die takk se naam nie. Dit raak net rye met 'n `seed-`-id en `@voorbeeld.test`.
// Die mense het geen wagwoord nie, dus kan jy nie as hulle aanmeld nie.
import { createPrisma } from '../src/lib/server/db/create.ts';

const db = createPrisma(process.env.DATABASE_URL!);
type JobType = 'PERMANENT' | 'PART_TIME' | 'ODD_JOB' | 'SEASONAL';

const categories = new Map(
	(await db.category.findMany({ where: { kind: 'JOB' } })).map((c) => [c.name, c.id])
);
const category = (name: string) => {
	const id = categories.get(name);
	if (!id) throw new Error(`Kategorie "${name}" bestaan nie. Loop eers npm run db:seed.`);
	return id;
};

const workers: {
	key: string;
	name: string;
	headline?: string;
	bio?: string;
	categories: string[];
	jobTypes: JobType[];
	available?: boolean;
	blocked?: boolean;
}[] = [
	{
		key: 'piet',
		name: 'Piet Messelaar',
		headline: 'Ervare messelaar en teëlwerker',
		categories: ['Konstruksie'],
		jobTypes: ['ODD_JOB', 'SEASONAL']
	},
	{
		key: 'sarel',
		name: 'Sarel Seisoen',
		headline: 'Werk graag buite',
		categories: ['Konstruksie', 'Tuin'],
		jobTypes: ['SEASONAL']
	},
	{
		key: 'anna',
		name: 'Anna Tuin',
		headline: 'Tuinier en snoeier',
		bio: 'Ek werk al tien jaar in tuine in die dorp.',
		categories: ['Tuin'],
		jobTypes: ['ODD_JOB', 'PART_TIME']
	},
	{
		key: 'koos',
		name: 'Koos Vakansie',
		categories: ['Konstruksie'],
		jobTypes: ['ODD_JOB'],
		available: false
	},
	{
		key: 'marie',
		name: 'Marie Oppas',
		headline: 'Kinderoppas met eerstehulp',
		categories: ['Kinderoppas'],
		jobTypes: ['PART_TIME']
	},
	{
		key: 'johan',
		name: 'Johan Vervoer',
		headline: 'Bakkie en sleepwa',
		categories: ['Vervoer', 'Konstruksie'],
		jobTypes: ['PERMANENT', 'ODD_JOB']
	},
	{
		key: 'elsa',
		name: 'Elsa Kok',
		headline: 'Kos vir geleenthede',
		categories: ['Kos en spysenier'],
		jobTypes: ['PART_TIME', 'SEASONAL']
	},
	{
		key: 'dawid',
		name: 'Dawid Boer',
		categories: ['Boord en landbou'],
		jobTypes: ['SEASONAL', 'PERMANENT']
	},
	{
		key: 'sarie',
		name: 'Sarie Skoonmaak',
		categories: ['Huishoudelik'],
		jobTypes: ['ODD_JOB', 'PART_TIME']
	},
	{
		key: 'blokkie',
		name: 'Blokkie Geblokkeer',
		categories: ['Konstruksie'],
		jobTypes: ['ODD_JOB'],
		blocked: true
	}
];

const listings = [
	{
		title: 'Hulp met ’n muur',
		description: 'Ons soek twee mense om ’n tuinmuur te bou. Eie gereedskap is ’n pluspunt.',
		category: 'Konstruksie',
		jobType: 'ODD_JOB' as const,
		capacity: 2,
		price: 'R400 per dag'
	},
	{
		title: 'Tuinhulp Saterdae',
		description: 'Gras sny en blomperke skoonmaak, ’n paar uur per week.',
		category: 'Tuin',
		jobType: 'PART_TIME' as const,
		capacity: 1,
		price: 'R80 per uur'
	},
	{
		title: 'Vrugte-pluk',
		description: 'Pluk-seisoen op die plaas. Ons begin vroegoggend.',
		category: 'Boord en landbou',
		jobType: 'SEASONAL' as const,
		capacity: 5,
		price: 'R350 per dag',
		startsAt: new Date('2026-12-01T00:00:00+02:00'),
		endsAt: new Date('2027-02-28T00:00:00+02:00')
	}
];

// Opruim: CASCADE vee profiele, belangstellings en plasings saam uit.
await db.user.deleteMany({ where: { id: { startsWith: 'seed-' } } });

const base = { emailVerified: true };

for (const w of workers) {
	await db.user.create({
		data: {
			...base,
			id: `seed-${w.key}`,
			name: w.name,
			email: `seed-${w.key}@voorbeeld.test`,
			profile: {
				create: {
					popiaConsentAt: new Date(),
					headline: w.headline,
					bio: w.bio,
					available: w.available ?? true,
					blocked: w.blocked ?? false
				}
			},
			interests: { create: w.categories.map((c) => ({ categoryId: category(c) })) },
			jobTypePrefs: { create: w.jobTypes.map((jobType) => ({ jobType })) }
		}
	});
}

// 'n Plaser: geen belangstellings nie, `available` af (soos die plaser-aanboording).
await db.user.create({
	data: {
		...base,
		id: 'seed-hendrik',
		name: 'Hendrik Plaser',
		email: 'seed-hendrik@voorbeeld.test',
		profile: {
			create: {
				popiaConsentAt: new Date(),
				headline: 'Boer op Rietfontein',
				available: false
			}
		},
		listings: {
			create: listings.map(({ category: c, jobType, ...l }) => ({
				kind: 'JOB' as const,
				categoryId: category(c),
				...l,
				job: { create: { jobType } }
			}))
		}
	}
});

console.log(`✔ ${workers.length} mense, 1 plaser en ${listings.length} plasings gesaai`);
await db.$disconnect();
