import { error } from '@sveltejs/kit';
import { formatDate, toDateInput } from '#lib/dates.ts';
import type { SaveListingInput } from '#lib/schemas/listing.ts';
import type { Database, Transaction } from '../db/create.ts';
import { DB, type ListingStatus } from '../db/index.ts';
import { withRequestId } from '../idempotency.ts';
import { JOB_TYPE_LABELS, jobKind } from './kinds/job.ts';
import { kinds } from './kinds/index.ts';
import { estimateRecipients } from './matching.ts';
import { assertActiveMember } from './members.ts';
import { photoUrl } from './photos.ts';
import { assertActiveJobCategories } from './profile.ts';
import { getMyResponseTo } from './responses.ts';

export const MAX_OPEN_LISTINGS = 5;

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
	OPEN: 'Oop',
	CLOSED: 'Vol',
	COMPLETED: 'Voltooi',
	CANCELLED: 'Gekanselleer'
};

/** Splits die vorm in die algemene deel en die soort se detail. Net `JOB` bestaan tans. */
function split(input: SaveListingInput) {
	const { jobType } = input;
	const base = {
		categoryId: input.categoryId,
		title: input.title,
		description: input.description,
		price: input.price,
		location: input.location,
		capacity: input.capacity,
		startsAt: input.startsAt,
		endsAt: input.endsAt,
		closesAt: input.closesAt
	};
	return { base, details: { jobType } };
}

/** 404 as die plasing nie joune is nie, 409 as dit nie meer verander kan word nie. */
async function failToChange(userId: string, id: string, tx: Transaction): Promise<never> {
	const listing = await DB.listing.findByIdForOwner(id, userId, tx);
	if (!listing) error(404, 'Hierdie plasing bestaan nie');
	error(409, 'Hierdie plasing kan nie meer verander word nie');
}

/** Skep of wysig (as `input.id` gestel is) 'n plasing. */
export function saveListing(userId: string, input: SaveListingInput, client?: Database) {
	return input.id
		? updateListing(userId, input.id, input, client)
		: createListing(userId, input, client);
}

async function createListing(userId: string, input: SaveListingInput, client?: Database) {
	const { base, details } = split(input);
	const { result } = await withRequestId(
		userId,
		input.requestId,
		'listings.create',
		async (tx) => {
			await assertActiveMember(userId, tx, 'plasings maak');
			await assertActiveJobCategories([base.categoryId], tx);

			await DB.listing.lockOwner(userId, tx);
			if ((await DB.listing.countOpenByOwner(userId, tx)) >= MAX_OPEN_LISTINGS) {
				error(400, `Jy kan hoogstens ${MAX_OPEN_LISTINGS} oop plasings op ’n slag hê`);
			}

			const { id } = await DB.listing.create(userId, { kind: 'JOB', ...base }, tx);
			await kinds.JOB.createDetails(tx, id, details);
			return { id };
		},
		client
	);
	return result;
}

/**
 * Sodra iemand gereageer het, is kategorie en werktipe gesluit (hulle het op daardie plasing
 * gereageer), en `capacity` moet meer wees as die aantal wat reeds aanvaar is.
 */
async function assertEditable(
	userId: string,
	id: string,
	base: ReturnType<typeof split>['base'],
	details: ReturnType<typeof split>['details'],
	tx: Transaction
) {
	const current = await DB.listing.findByIdForOwner(id, userId, tx);
	if (!current?.job || current.status !== 'OPEN') return; // `failToChange` kies die regte fout

	// Elke navraag kos ±170 ms op Neon, en die transaksie het 5 s: vra net wat hierdie wysiging raak.
	const lockedChanged =
		current.categoryId !== base.categoryId || current.job.jobType !== details.jobType;
	if (lockedChanged && (await DB.response.countNotWithdrawn(id, tx)) > 0) {
		error(409, 'Iemand het reeds gereageer; die kategorie en tipe werk kan nie meer verander nie');
	}

	// 'n Hoër kapasiteit kan nooit die aanvaardes onderskry nie.
	if (base.capacity < current.capacity) {
		const accepted = await DB.response.countByStatus(id, 'ACCEPTED', tx);
		if (base.capacity <= accepted) {
			error(
				400,
				`Jy het reeds ${accepted} aanvaar; kies meer plekke as dit, of voltooi die plasing`
			);
		}
	}
}

async function updateListing(
	userId: string,
	id: string,
	input: SaveListingInput,
	client?: Database
) {
	const { base, details } = split(input);
	await assertActiveJobCategories([base.categoryId], client); // buite die transaksie: dit is net 'n kontrole
	const { result } = await withRequestId(
		userId,
		input.requestId,
		'listings.update',
		async (tx) => {
			await DB.response.lockListing(id, tx);
			await assertEditable(userId, id, base, details, tx);
			if ((await DB.listing.updateOpen(id, userId, base, tx)) === 0) {
				await failToChange(userId, id, tx);
			}
			await kinds.JOB.updateDetails(tx, id, details);
			return { id };
		},
		client
	);
	return result;
}

async function changeStatus(
	userId: string,
	id: string,
	requestId: string,
	action: string,
	to: ListingStatus,
	client?: Database
) {
	const { result } = await withRequestId(
		userId,
		requestId,
		action,
		async (tx) => {
			await DB.response.lockListing(id, tx);
			// 'n Vol plasing (`CLOSED`) mag nog voltooi of gekanselleer word.
			if ((await DB.listing.transition(id, userId, ['OPEN', 'CLOSED'], to, tx)) === 0) {
				await failToChange(userId, id, tx);
			}
			return { id };
		},
		client
	);
	return result;
}

export const cancelListing = (userId: string, id: string, requestId: string, client?: Database) =>
	changeStatus(userId, id, requestId, 'listings.cancel', 'CANCELLED', client);

export const completeListing = (userId: string, id: string, requestId: string, client?: Database) =>
	changeStatus(userId, id, requestId, 'listings.complete', 'COMPLETED', client);

/** Hoeveel mense sal hierdie plasing se kennisgewing kry? Vir die regstreekse skatting in die vorm. */
export function estimate(
	userId: string,
	input: {
		categoryId: number;
		jobType: Parameters<typeof jobKind.matchFilter>[0]['jobType'];
	}
) {
	return estimateRecipients({
		kind: 'JOB',
		categoryId: input.categoryId,
		ownerId: userId,
		details: { jobType: input.jobType }
	});
}

export const dateRange = (a: Date | null, b: Date | null) =>
	a && b
		? `${formatDate(a)} tot ${formatDate(b)}`
		: a
			? `Vanaf ${formatDate(a)}`
			: b
				? `Tot ${formatDate(b)}`
				: null;

export async function getMyListings(userId: string) {
	const listings = await DB.listing.listByOwner(userId);
	return listings.map((l) => ({
		id: l.id,
		title: l.title,
		status: l.status,
		statusLabel: LISTING_STATUS_LABELS[l.status],
		isOpen: l.status === 'OPEN',
		category: l.category.name,
		icon: l.category.icon,
		jobType: l.job ? JOB_TYPE_LABELS[l.job.jobType] : null,
		when: dateRange(l.startsAt, l.endsAt),
		createdAt: formatDate(l.createdAt)
	}));
}

/** Een plasing soos die vorm dit wil hê (vir wysig). Net vir die eienaar. */
export async function getListingForEdit(userId: string, id: string) {
	const l = await DB.listing.findByIdForOwner(id, userId);
	if (!l || !l.job) error(404, 'Hierdie plasing bestaan nie');
	if (l.status !== 'OPEN') error(409, 'Net oop plasings kan gewysig word');

	const [responses, accepted] = await Promise.all([
		DB.response.countNotWithdrawn(id),
		DB.response.countByStatus(id, 'ACCEPTED')
	]);

	return {
		id: l.id,
		categoryId: String(l.categoryId),
		title: l.title,
		description: l.description ?? '',
		price: l.price ?? '',
		location: l.location ?? '',
		capacity: String(l.capacity),
		startsAt: toDateInput(l.startsAt),
		endsAt: toDateInput(l.endsAt),
		closesAt: toDateInput(l.closesAt),
		jobType: l.job.jobType,
		// Ná die eerste reaksie is kategorie en werktipe gesluit, en kapasiteit moet meer as die aanvaardes wees.
		locked: responses > 0,
		minCapacity: accepted + 1
	};
}

/**
 * 'n Plasing soos `viewerId` dit mag sien. Net aangemelde lede; die eienaar sien alle statusse,
 * ander net oop plasings van 'n plaser wat nie geblokkeer is nie. Een 404 vir alles anders.
 */
export async function getListing(viewerId: string, id: string) {
	const l = await DB.listing.findForMembers(id);
	const isOwner = l?.ownerId === viewerId;
	if (!l || !l.job) error(404, 'Hierdie plasing bestaan nie');

	// Ander as die eienaar sien 'n plasing net terwyl dit oop is, of as hulle self daarop gereageer het
	// (so bly 'n aanvaarde plasing met sy kontak sigbaar nadat dit vol geraak het).
	const mine = isOwner ? null : await getMyResponseTo(viewerId, id, l.ownerId);
	if (!isOwner && ((l.status !== 'OPEN' && !mine) || l.owner.profile?.blocked)) {
		error(404, 'Hierdie plasing bestaan nie');
	}

	const [acceptedCount, responseCount] = await Promise.all([
		DB.response.countByStatus(id, 'ACCEPTED'),
		isOwner ? DB.response.countNotWithdrawn(id) : 0
	]);

	const isOpen = l.status === 'OPEN';
	const pastDeadline = l.closesAt !== null && l.closesAt < new Date();

	return {
		id: l.id,
		title: l.title,
		description: l.description,
		price: l.price,
		location: l.location,
		capacity: l.capacity,
		acceptedCount,
		responseCount,
		status: l.status,
		statusLabel: LISTING_STATUS_LABELS[l.status],
		isOwner,
		isOpen,
		// Die bediener besluit; die kliënt wys net die knoppie.
		canRespond: !isOwner && isOpen && !pastDeadline && (!mine || mine.status === 'WITHDRAWN'),
		myResponse: mine,
		category: l.category.name,
		icon: l.category.icon,
		jobType: JOB_TYPE_LABELS[l.job.jobType],
		startsAt: l.startsAt && formatDate(l.startsAt),
		endsAt: l.endsAt && formatDate(l.endsAt),
		closesAt: l.closesAt && formatDate(l.closesAt),
		postedAt: formatDate(l.createdAt),
		owner: {
			id: l.owner.id,
			name: l.owner.name,
			image: photoUrl(l.owner.profile?.photoKey, l.owner.image),
			headline: l.owner.profile?.headline ?? null
		}
	};
}

export const openListingCount = (userId: string) => DB.listing.countOpenByOwner(userId);
