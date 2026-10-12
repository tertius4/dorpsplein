import { prisma } from './client.ts';
import type { Db, Transaction } from './create.ts';
import type { ListingKind, ListingStatus } from './generated/client.ts';

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

export const listing = {
	/** Skep net die algemene deel; die soort se `createDetails` skryf die detail in dieselfde transaksie. */
	create: (ownerId: string, data: ListingInput, db: Db = prisma()) =>
		db.listing.create({ data: { ...data, ownerId }, select: { id: true } }),

	/** Net die plasing self, sonder eienaar-kontrole. Gebruik dit nooit om data terug te gee nie. */
	findById: (id: string, db: Db = prisma()) => db.listing.findUnique({ where: { id } }),

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

	/**
	 * Oop plasings van ander mense vir /geleenthede. Sluit uit: eie plasings, geblokkeerde plasers,
	 * verstreke sperdatums, en plasings waarop `memberId` reeds gereageer het (behalwe onttrek).
	 * PRIVAATHEID: die plaser se `select` is 'n witlys.
	 */
	listOpenForMember: (memberId: string, take: number, db: Db = prisma()) =>
		db.listing.findMany({
			where: {
				status: 'OPEN',
				ownerId: { not: memberId },
				owner: { profile: { is: { blocked: false } } },
				OR: [{ closesAt: null }, { closesAt: { gte: new Date() } }],
				responses: { none: { responderId: memberId, status: { not: 'WITHDRAWN' } } }
			},
			include: {
				category: { select: { id: true, name: true, icon: true } },
				job: true,
				owner: {
					select: { id: true, name: true, image: true, profile: { select: { photoKey: true } } }
				}
			},
			orderBy: { createdAt: 'desc' },
			take
		}),

	listByOwner: async (ownerId: string, db: Db = prisma()) => {
		return db.listing.findMany({
			where: { ownerId },
			include: { category: { select: { name: true, icon: true } }, job: true },
			orderBy: [{ createdAt: 'desc' }]
		});
	},

	/**
	 * Sluit "plaas 'n plasing" per eienaar vir die duur van die transaksie, sodat twee
	 * gelyktydige versoeke nie albei die limiet van oop plasings kan omseil nie.
	 */
	lockOwner: async (ownerId: string, tx: Transaction) => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerId}))`;
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
		db: Db = prisma()
	) => {
		const { count } = await db.listing.updateMany({ where: { id, ownerId, status: 'OPEN' }, data });
		return count;
	},

	/** Status-oorgang `from` → `to`; 'n tweede oorgang gee 0 en oorskryf niks nie. */
	transition: async (
		id: string,
		ownerId: string,
		from: ListingStatus | ListingStatus[],
		to: ListingStatus,
		db: Db = prisma()
	) => {
		const { count } = await db.listing.updateMany({
			where: { id, ownerId, status: { in: Array.isArray(from) ? from : [from] } },
			data: { status: to }
		});
		return count;
	},

	/** Dieselfde oorgang sonder eienaar-kontrole, vir die diens se eie reëls (bv. heropen ná onttrekking). */
	transitionById: async (id: string, from: ListingStatus, to: ListingStatus, db: Db = prisma()) => {
		const { count } = await db.listing.updateMany({
			where: { id, status: from },
			data: { status: to }
		});
		return count;
	}
};
