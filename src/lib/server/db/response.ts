import { prisma } from './client.ts';
import type { Db, Transaction } from './create.ts';
import type { ResponseStatus } from './generated/client.ts';

/** Reaksies wat nog 'n plek in beslag neem of kan neem (nie onttrek of afgewys nie). */
const LIVE: ResponseStatus[] = ['INTERESTED', 'ACCEPTED'];

export const response = {
	/**
	 * Sluit 'n plasing se reaksies vir die duur van die transaksie, sodat twee gelyktydige
	 * aanvaardings nie saam die `capacity` kan oorskry nie.
	 */
	lockListing: async (listingId: string, tx: Transaction) => {
		await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'response:' + listingId}))`;
	},

	findById: (id: string, db: Db = prisma()) => db.response.findUnique({ where: { id } }),

	/** Eienaarskap in die navraag (IDOR): 'n ander gebruiker se reaksie gee `null`. */
	findByIdForResponder: (id: string, responderId: string, db: Db = prisma()) =>
		db.response.findFirst({ where: { id, responderId } }),

	findByListingAndResponder: (listingId: string, responderId: string, db: Db = prisma()) =>
		db.response.findUnique({ where: { listingId_responderId: { listingId, responderId } } }),

	/** Skep 'n reaksie, of maak 'n onttrekte een weer `INTERESTED`. Die service het die status reeds nagegaan. */
	upsertInterested: (
		listingId: string,
		responderId: string,
		note: string | null,
		db: Db = prisma()
	) =>
		db.response.upsert({
			where: { listingId_responderId: { listingId, responderId } },
			create: { listingId, responderId, note },
			update: { status: 'INTERESTED', note },
			select: { id: true }
		}),

	/** Status-oorgang; gee die aantal rye terug (0 = reaksie bestaan nie of is nie meer in `from` nie). */
	transition: async (
		id: string,
		from: ResponseStatus | ResponseStatus[],
		to: ResponseStatus,
		db: Db = prisma()
	) => {
		const { count } = await db.response.updateMany({
			where: { id, status: { in: Array.isArray(from) ? from : [from] } },
			data: { status: to }
		});
		return count;
	},

	/** Die plasing het vol geraak: wie nog wag, is afgewys. */
	declineWaiting: async (listingId: string, db: Db = prisma()) => {
		const { count } = await db.response.updateMany({
			where: { listingId, status: 'INTERESTED' },
			data: { status: 'DECLINED' }
		});
		return count;
	},

	countByStatus: (listingId: string, status: ResponseStatus, db: Db = prisma()) =>
		db.response.count({ where: { listingId, status } }),

	/** Reaksies wat nie onttrek is nie; hierna mag die plaser nie meer kategorie of werktipe verander nie. */
	countNotWithdrawn: (listingId: string, db: Db = prisma()) =>
		db.response.count({ where: { listingId, status: { not: 'WITHDRAWN' } } }),

	/** Hoeveel reaksies wag op 'n besluit van `ownerId`? */
	countWaitingForOwner: (ownerId: string, db: Db = prisma()) =>
		db.response.count({ where: { status: 'INTERESTED', listing: { ownerId, status: 'OPEN' } } }),

	/** Hoeveel reaksies van `responderId` is nog lewendig (wag of aanvaar) op oop of vol plasings? */
	countLiveByResponder: (responderId: string, db: Db = prisma()) =>
		db.response.count({
			where: {
				responderId,
				status: { in: LIVE },
				listing: { status: { in: ['OPEN', 'CLOSED'] } }
			}
		}),

	/**
	 * PRIVAATHEID: die reageerder se `select` is 'n witlys. Foon en e-pos word nooit gelees nie;
	 * die service vra die foon apart en net vir `ACCEPTED`.
	 */
	listForListing: (listingId: string, db: Db = prisma()) =>
		db.response.findMany({
			where: { listingId },
			select: {
				id: true,
				status: true,
				note: true,
				createdAt: true,
				responder: {
					select: {
						id: true,
						name: true,
						image: true,
						profile: { select: { headline: true, photoKey: true } }
					}
				}
			},
			orderBy: { createdAt: 'asc' }
		}),

	/** PRIVAATHEID: die plaser se `select` is 'n witlys (sien `listForListing`). */
	listByResponder: (responderId: string, db: Db = prisma()) =>
		db.response.findMany({
			where: { responderId },
			select: {
				id: true,
				status: true,
				note: true,
				createdAt: true,
				listing: {
					select: {
						id: true,
						title: true,
						status: true,
						ownerId: true,
						category: { select: { name: true, icon: true } },
						job: { select: { jobType: true } },
						owner: {
							select: {
								id: true,
								name: true,
								image: true,
								profile: { select: { photoKey: true } }
							}
						}
					}
				}
			},
			orderBy: { updatedAt: 'desc' }
		}),

	/**
	 * "N voltooi" op 'n profiel: plasings wat voltooi is en waarvoor die persoon aanvaar is,
	 * plus voltooide plasings van die persoon waarvoor iemand aanvaar is.
	 */
	countCompletedForUser: async (userId: string, db: Db = prisma()) => {
		const [asResponder, asOwner] = await Promise.all([
			db.response.count({
				where: { responderId: userId, status: 'ACCEPTED', listing: { status: 'COMPLETED' } }
			}),
			db.listing.count({
				where: { ownerId: userId, status: 'COMPLETED', responses: { some: { status: 'ACCEPTED' } } }
			})
		]);
		return asResponder + asOwner;
	}
};
