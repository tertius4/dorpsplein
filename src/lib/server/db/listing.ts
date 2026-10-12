import { prisma } from './client.ts';
import type { Db } from './create.ts';
import type { JobType, ListingKind, ListingStatus } from './generated/client.ts';

export interface ListingInput {
	kind: ListingKind;
	categoryId: number;
	title: string;
	description: string | null;
	price: string | null;
	capacity: number;
	location: string | null;
	startsAt: Date | null;
	endsAt: Date | null;
	closesAt: Date | null;
}

export interface JobDetailsInput {
	jobType: JobType;
	requiresDriversLicence: boolean;
}

export const listing = {
	/** Skep die plasing saam met sy werk-detail in een skryfopdrag. */
	createJob: async (
		ownerId: string,
		data: ListingInput,
		job: JobDetailsInput,
		db: Db = prisma()
	) => {
		const listing = await db.listing.create({
			data: { ...data, ownerId, job: { create: job } },
			select: { id: true }
		});

		return listing;
	},

	/** Eienaarskap in die navraag (IDOR): 'n ander gebruiker se plasing gee `null`. */
	findByIdForOwner: async (id: string, ownerId: string, db: Db = prisma()) => {
		const listing = await db.listing.findFirst({
			where: { id, ownerId },
			include: { category: true, job: true }
		});

		return listing;
	},

	/**
	 * PRIVAATHEID: die plaser se `select` is 'n witlys. E-pos en foon word nooit gelees nie.
	 * Die sigbaarheidsreëls (aangemeld, plaser nie geblokkeer nie) is in die service.
	 */
	findForMembers: (id: string, db: Db = prisma()) =>
		db.listing.findUnique({
			where: { id },
			include: {
				category: { select: { id: true, name: true, icon: true } },
				job: true,
				owner: {
					select: {
						id: true,
						name: true,
						image: true,
						profile: { select: { headline: true, photoKey: true, blocked: true } }
					}
				}
			}
		}),

	listByOwner: async (ownerId: string, db: Db = prisma()) => {
		return db.listing.findMany({
			where: { ownerId },
			include: { category: { select: { name: true, icon: true } }, job: true },
			orderBy: [{ createdAt: 'desc' }]
		});
	},
	
	countOpenByOwner: async (ownerId: string, db: Db = prisma()) => {
		const listing_count = await db.listing.count({ where: { ownerId, status: 'OPEN' } });
		return listing_count;
	},

	/** Wysig die algemene velde. Gee die aantal rye terug (0 = nie joune of nie meer oop nie). */
	updateOpen: async (
		id: string,
		ownerId: string,
		data: Omit<ListingInput, 'kind'>,
		job: JobDetailsInput | null,
		db: Db = prisma()
	) => {
		const { count } = await db.listing.updateMany({
			where: { id, ownerId, status: 'OPEN' },
			data
		});
		if (count === 1 && job) {
			await db.jobDetails.update({ where: { listingId: id }, data: job });
		}
		return count;
	},

	/** Status-oorgang `from` → `to`; 'n tweede oorgang gee 0 en oorskryf niks nie. */
	transition: async (
		id: string,
		ownerId: string,
		from: ListingStatus,
		to: ListingStatus,
		db: Db = prisma()
	) => {
		const { count } = await db.listing.updateMany({
			where: { id, ownerId, status: from },
			data: { status: to }
		});
		return count;
	}
};
