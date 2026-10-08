// Seed data for dev. Run with npm run db:seed
import 'dotenv/config';
import { createPrisma } from '../src/lib/server/db/create.ts';

const jobCategories = [
	{ name: 'Konstruksie', icon: '🧱' },
	{ name: 'Boord en landbou', icon: '🌳' },
	{ name: 'Tuin', icon: '🌱' },
	{ name: 'Huishoudelik', icon: '🏠' },
	{ name: 'Kinderoppas', icon: '🧸' },
	{ name: 'Vervoer', icon: '🚚' },
	{ name: 'Kos en spysenier', icon: '🍲' },
	{ name: 'Kantoor en admin', icon: '🗂️' },
	{ name: 'Tegnies en IT', icon: '💻' },
	{ name: 'Ander', icon: '✳️' }
];

const db = createPrisma(process.env.DATABASE_URL);

for (const [sortOrder, { name, icon }] of jobCategories.entries()) {
	await db.category.upsert({
		where: { kind_name: { kind: 'JOB', name } },
		update: { icon, sortOrder },
		create: { kind: 'JOB', name, icon, sortOrder }
	});
}

console.log(`✔ ${jobCategories.length} werk-kategorieë gesaai`);
await db.$disconnect();
