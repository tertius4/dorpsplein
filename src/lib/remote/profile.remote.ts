import { command, form, query } from '$app/server';
import { getCurrentUser } from '#lib/remote/auth.remote.ts';
import { requireUser } from '#lib/server/guards.ts';
import * as profile from '#lib/server/services/profile.ts';
import {
	aboutSchema,
	availabilitySchema,
	interestsSchema,
	jobPreferencesSchema,
	publicProfileSchema,
	qualificationIdSchema,
	qualificationSchema
} from '#lib/schemas/profile.ts';

export const getMyProfile = query(async () => {
	const user = requireUser();
	return profile.getMyProfile(user.id);
});

// Elke mutasie ververs `getMyProfile` op die bediener: die nuwe data gaan saam
// met die antwoord terug (single-flight), sonder 'n tweede versoek.

export const updateAbout = form(aboutSchema, async (input) => {
	const user = requireUser();
	await profile.updateAbout(user.id, input);
	await getMyProfile().refresh();
	// `locals.user` in hierdie versoek het nog die ou naam, dus refresh() sou die
	// ou waarde teruggee. Ons stuur eerder self die nuwe waarde vir die kopstrook saam.
	getCurrentUser().set({ id: user.id, name: input.name });
	return { saved: true };
});

export const updateInterests = form(interestsSchema, async (items) => {
	const user = requireUser();
	await profile.updateInterests(user.id, items);
	await getMyProfile().refresh();
	return { saved: true };
});

export const updateJobPreferences = form(jobPreferencesSchema, async (input) => {
	const user = requireUser();
	await profile.updateJobPreferences(user.id, input);
	await getMyProfile().refresh();
	return { saved: true };
});

export const setAvailable = command(availabilitySchema, async (available) => {
	const user = requireUser();
	await profile.setAvailable(user.id, available);
	await getMyProfile().refresh();
});

export const setPublicProfile = command(publicProfileSchema, async (publicProfile) => {
	const user = requireUser();
	await profile.setPublicProfile(user.id, publicProfile);
	await getMyProfile().refresh();
});

export const addQualification = form(qualificationSchema, async (input) => {
	const user = requireUser();
	await profile.addQualification(user.id, input);
	await getMyProfile().refresh();
	return { saved: true };
});

export const removeQualification = command(qualificationIdSchema, async (id) => {
	const user = requireUser();
	await profile.removeQualification(user.id, id);
	await getMyProfile().refresh();
});
