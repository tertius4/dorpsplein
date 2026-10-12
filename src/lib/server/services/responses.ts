import { error } from '@sveltejs/kit';
import { formatDate } from '#lib/dates.ts';
import type { RespondInput } from '#lib/schemas/response.ts';
import type { Database } from '../db/create.ts';
import { DB, type ResponseStatus } from '../db/index.ts';
import { withRequestId } from '../idempotency.ts';
import { JOB_TYPE_LABELS } from './kinds/job.ts';
import { assertActiveMember } from './members.ts';
import { photoUrl } from './photos.ts';
import { formatPhone } from './profile.ts';

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
	INTERESTED: 'Wag',
	WITHDRAWN: 'Onttrek',
	ACCEPTED: 'Aanvaar',
	DECLINED: 'Afgewys'
};

/** Selnommer in vertoonvorm met bel- en WhatsApp-skakels. `null` as die persoon geen nommer het nie. */
export function toContact(phone: string | null | undefined) {
	if (!phone) return null;
	return {
		phone: formatPhone(phone),
		tel: `tel:${phone}`,
		whatsapp: `https://wa.me/${phone.replace(/^\+/, '')}`
	};
}

/**
 * KONTAK-SIGBAARHEID: 'n selnommer word net gelees vir die ander party van 'n `ACCEPTED`-reaksie.
 * Die status kom uit die databasis; die kliënt kan dit nie beïnvloed nie.
 */
async function contactsOf(accepted: { userId: string }[]) {
	if (accepted.length === 0) return new Map<string, ReturnType<typeof toContact>>();
	const phones = await DB.profile.findPhones(accepted.map((a) => a.userId));
	return new Map(accepted.map((a) => [a.userId, toContact(phones.get(a.userId))]));
}

/** Die reaksie van `userId` op 'n plasing, vir die plasing se bladsy. `null` as hy nog nie gereageer het nie. */
export async function getMyResponseTo(userId: string, listingId: string, ownerId: string) {
	const r = await DB.response.findByListingAndResponder(listingId, userId);
	if (!r) return null;
	const contact =
		r.status === 'ACCEPTED' ? (await contactsOf([{ userId: ownerId }])).get(ownerId) : null;
	return {
		id: r.id,
		status: r.status,
		statusLabel: RESPONSE_STATUS_LABELS[r.status],
		note: r.note,
		ownerContact: contact ?? null
	};
}

/** 'n Plasing waarop gereageer mag word: oop, nie die sperdatum verby nie, en deur 'n ander plaser. */
function assertOpenForResponses(
	l: {
		ownerId: string;
		status: string;
		closesAt: Date | null;
		owner: { profile: { blocked: boolean } | null };
	} | null,
	userId: string
): asserts l {
	if (!l || l.owner.profile?.blocked) error(404, 'Hierdie plasing bestaan nie');
	if (l.ownerId === userId) error(400, 'Jy kan nie op jou eie plasing reageer nie');
	if (l.status !== 'OPEN') error(409, 'Hierdie plasing is nie meer oop nie');
	if (l.closesAt && l.closesAt < new Date())
		error(409, 'Die sperdatum vir reaksies het verby gegaan');
}

/** "Ek is beskikbaar". `WITHDRAWN` mag weer reageer; enige ander bestaande reaksie is 409. */
export async function respond(userId: string, input: RespondInput, client?: Database) {
	const { result } = await withRequestId(
		userId,
		input.requestId,
		'responses.respond',
		async (tx) => {
			await assertActiveMember(userId, tx, 'reageer');
			await DB.response.lockListing(input.listingId, tx);

			assertOpenForResponses(await DB.listing.findForMembers(input.listingId, tx), userId);

			const existing = await DB.response.findByListingAndResponder(input.listingId, userId, tx);
			if (existing?.status === 'INTERESTED' || existing?.status === 'ACCEPTED') {
				error(409, 'Jy het reeds op hierdie plasing gereageer');
			}
			if (existing?.status === 'DECLINED') error(409, 'Die plaser het jou reaksie afgewys');

			const { id } = await DB.response.upsertInterested(input.listingId, userId, input.note, tx);
			return { id, listingId: input.listingId };
		},
		client
	);
	return result;
}

/**
 * Onttrek. 'n Aanvaarde reaksie mag ook onttrek; as die plasing daardeur 'n plek kry, gaan dit
 * weer oop (wie reeds afgewys is, bly afgewys).
 */
export async function withdraw(
	userId: string,
	responseId: string,
	requestId: string,
	client?: Database
) {
	const { result } = await withRequestId(
		userId,
		requestId,
		'responses.withdraw',
		async (tx) => {
			const mine = await DB.response.findByIdForResponder(responseId, userId, tx);
			if (!mine) error(404, 'Hierdie reaksie bestaan nie');
			await DB.response.lockListing(mine.listingId, tx);

			const listing = await DB.listing.findById(mine.listingId, tx);
			if (!listing || (listing.status !== 'OPEN' && listing.status !== 'CLOSED')) {
				error(409, 'Hierdie plasing is reeds afgehandel');
			}

			if (
				(await DB.response.transition(mine.id, ['INTERESTED', 'ACCEPTED'], 'WITHDRAWN', tx)) === 0
			) {
				error(409, 'Jy het reeds onttrek of is afgewys');
			}
			if (mine.status === 'ACCEPTED' && listing.status === 'CLOSED') {
				await DB.listing.transitionById(listing.id, 'CLOSED', 'OPEN', tx);
			}
			return { id: responseId, listingId: mine.listingId };
		},
		client
	);
	return result;
}

/** Laai die reaksie en sluit sy plasing; 404 as die plasing nie van `ownerId` is nie. */
async function ownedResponse(
	ownerId: string,
	responseId: string,
	tx: Parameters<Parameters<typeof withRequestId>[3]>[0]
) {
	const r = await DB.response.findById(responseId, tx);
	if (!r) error(404, 'Hierdie reaksie bestaan nie');
	await DB.response.lockListing(r.listingId, tx);

	const listing = await DB.listing.findByIdForOwner(r.listingId, ownerId, tx);
	if (!listing) error(404, 'Hierdie reaksie bestaan nie');
	if (listing.status !== 'OPEN') error(409, 'Net oop plasings kan reaksies besluit');
	return { response: r, listing };
}

/**
 * Aanvaar. Sodra die aantal aanvaardes `capacity` bereik, sluit die plasing en word die
 * wat nog wag afgewys. Alles onder 'n slot, sodat gelyktydige aanvaardings nie oorskry nie.
 */
export async function acceptResponse(
	ownerId: string,
	responseId: string,
	requestId: string,
	client?: Database
) {
	const { result } = await withRequestId(
		ownerId,
		requestId,
		'responses.accept',
		async (tx) => {
			const { response, listing } = await ownedResponse(ownerId, responseId, tx);

			if ((await DB.response.transition(response.id, 'INTERESTED', 'ACCEPTED', tx)) === 0) {
				error(409, 'Hierdie reaksie wag nie meer op ’n besluit nie');
			}

			const accepted = await DB.response.countByStatus(listing.id, 'ACCEPTED', tx);
			const full = accepted >= listing.capacity;
			if (full) {
				await DB.listing.transition(listing.id, ownerId, 'OPEN', 'CLOSED', tx);
				await DB.response.declineWaiting(listing.id, tx);
			}
			return { id: responseId, listingId: listing.id, full };
		},
		client
	);
	return result;
}

export async function declineResponse(
	ownerId: string,
	responseId: string,
	requestId: string,
	client?: Database
) {
	const { result } = await withRequestId(
		ownerId,
		requestId,
		'responses.decline',
		async (tx) => {
			const { response, listing } = await ownedResponse(ownerId, responseId, tx);
			if ((await DB.response.transition(response.id, 'INTERESTED', 'DECLINED', tx)) === 0) {
				error(409, 'Hierdie reaksie wag nie meer op ’n besluit nie');
			}
			return { id: responseId, listingId: listing.id };
		},
		client
	);
	return result;
}

/** Die plaser se oorsig: wie het gereageer, en (net vir aanvaardes) hoe om hulle te bereik. */
export async function getResponsesForListing(ownerId: string, listingId: string) {
	const listing = await DB.listing.findByIdForOwner(listingId, ownerId);
	if (!listing) error(404, 'Hierdie plasing bestaan nie');

	const rows = await DB.response.listForListing(listingId);
	const contacts = await contactsOf(
		rows.filter((r) => r.status === 'ACCEPTED').map((r) => ({ userId: r.responder.id }))
	);

	return {
		capacity: listing.capacity,
		accepted: rows.filter((r) => r.status === 'ACCEPTED').length,
		responses: rows
			.filter((r) => r.status !== 'WITHDRAWN')
			.map((r) => ({
				id: r.id,
				status: r.status,
				statusLabel: RESPONSE_STATUS_LABELS[r.status],
				canDecide: listing.status === 'OPEN' && r.status === 'INTERESTED',
				note: r.note,
				at: formatDate(r.createdAt),
				responder: {
					id: r.responder.id,
					name: r.responder.name,
					image: photoUrl(r.responder.profile?.photoKey, r.responder.image),
					headline: r.responder.profile?.headline ?? null
				},
				contact: r.status === 'ACCEPTED' ? (contacts.get(r.responder.id) ?? null) : null
			}))
	};
}

/** Alles waarop `userId` gereageer het, met die plaser se kontak waar hy aanvaar is. */
export async function getMyResponses(userId: string) {
	const rows = await DB.response.listByResponder(userId);
	const contacts = await contactsOf(
		rows.filter((r) => r.status === 'ACCEPTED').map((r) => ({ userId: r.listing.ownerId }))
	);

	return rows.map((r) => ({
		id: r.id,
		status: r.status,
		statusLabel: RESPONSE_STATUS_LABELS[r.status],
		canWithdraw:
			(r.status === 'INTERESTED' || r.status === 'ACCEPTED') &&
			(r.listing.status === 'OPEN' || r.listing.status === 'CLOSED'),
		note: r.note,
		at: formatDate(r.createdAt),
		listing: {
			id: r.listing.id,
			title: r.listing.title,
			isOpen: r.listing.status === 'OPEN',
			category: r.listing.category.name,
			icon: r.listing.category.icon,
			jobType: r.listing.job ? JOB_TYPE_LABELS[r.listing.job.jobType] : null,
			owner: {
				id: r.listing.owner.id,
				name: r.listing.owner.name,
				image: photoUrl(r.listing.owner.profile?.photoKey, r.listing.owner.image)
			}
		},
		contact: r.status === 'ACCEPTED' ? (contacts.get(r.listing.ownerId) ?? null) : null
	}));
}
