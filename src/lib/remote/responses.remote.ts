import { command, form, query } from '$app/server';
import { invalid, isHttpError } from '@sveltejs/kit';
import { z } from 'zod';
import { respondSchema, responseActionSchema } from '#lib/schemas/response.ts';
import { requireUser } from '#lib/server/guards.ts';
import * as responses from '#lib/server/services/responses.ts';
import { getListing } from './listings.remote.ts';

export const getMyResponses = query(async () => {
	const user = requireUser();
	return responses.getMyResponses(user.id);
});

/** Net vir die plaser. */
export const getResponsesForListing = query(z.string().min(1).max(64), async (listingId) => {
	const user = requireUser();
	return responses.getResponsesForListing(user.id, listingId);
});

/** "Ek is beskikbaar". 'n 400 of 409 word 'n boodskap by die vorm, nie 'n foutbladsy nie. */
export const respond = form(respondSchema, async (input) => {
	const user = requireUser();
	try {
		await responses.respond(user.id, input);
	} catch (e) {
		if (isHttpError(e) && (e.status === 400 || e.status === 409)) invalid(e.body.message);
		throw e;
	}
	await Promise.all([getListing(input.listingId).refresh(), getMyResponses().refresh()]);
});

export const withdraw = command(responseActionSchema, async ({ id, requestId }) => {
	const user = requireUser();
	const { listingId } = await responses.withdraw(user.id, id, requestId);
	await Promise.all([getListing(listingId).refresh(), getMyResponses().refresh()]);
});

export const acceptResponse = command(responseActionSchema, async ({ id, requestId }) => {
	const user = requireUser();
	const { listingId } = await responses.acceptResponse(user.id, id, requestId);
	await Promise.all([getListing(listingId).refresh(), getResponsesForListing(listingId).refresh()]);
});

export const declineResponse = command(responseActionSchema, async ({ id, requestId }) => {
	const user = requireUser();
	const { listingId } = await responses.declineResponse(user.id, id, requestId);
	await Promise.all([getListing(listingId).refresh(), getResponsesForListing(listingId).refresh()]);
});
