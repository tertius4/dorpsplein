import { command, form, query } from '$app/server';
import { invalid, isHttpError } from '@sveltejs/kit';
import { z } from 'zod';
import { estimateSchema, listingActionSchema, saveListingSchema } from '#lib/schemas/listing.ts';
import { requireUser } from '#lib/server/guards.ts';
import * as listings from '#lib/server/services/listings.ts';
import { redirect } from '@sveltejs/kit';

export const getMyListings = query(async () => {
	const user = requireUser();
	return listings.getMyListings(user.id);
});

export const getListing = query(z.string().min(1).max(64), async (id) => {
	const user = requireUser();
	return listings.getListing(user.id, id);
});

/** Die plasing in die vorm se vorm, om te wysig. */
export const getListingForEdit = query(z.string().min(1).max(64), async (id) => {
	const user = requireUser();
	return listings.getListingForEdit(user.id, id);
});

export const estimateRecipients = query(estimateSchema, async (input) => {
	const user = requireUser();
	return listings.estimate(user.id, input);
});

/** Skep (geen `id`) of wysig (met `id`) 'n plasing. */
export const saveListing = form(saveListingSchema, async (input) => {
	const user = requireUser();
	try {
		const { id } = await listings.saveListing(user.id, input);
		redirect(303, `/plasings/${id}`);
	} catch (e) {
		// 'n 400 (bv. die limiet van oop plasings) word 'n boodskap by die vorm, nie 'n foutbladsy nie.
		if (isHttpError(e) && e.status === 400) invalid(e.body.message);
		throw e;
	}
});

export const cancelListing = command(listingActionSchema, async ({ id, requestId }) => {
	const user = requireUser();
	await listings.cancelListing(user.id, id, requestId);
	await getListing(id).refresh();
});

export const completeListing = command(listingActionSchema, async ({ id, requestId }) => {
	const user = requireUser();
	await listings.completeListing(user.id, id, requestId);
	await getListing(id).refresh();
});
