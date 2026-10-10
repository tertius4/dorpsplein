import { command, form, query, requested } from '$app/server';
import { invalid, isHttpError } from '@sveltejs/kit';
import { getCurrentUser } from '#lib/remote/auth.remote.ts';
import { getHome } from '#lib/remote/home.remote.ts';
import { requireUser } from '#lib/server/guards.ts';
import * as photos from '#lib/server/services/photos.ts';
import * as profile from '#lib/server/services/profile.ts';
import {
	aboutSchema,
	availabilitySchema,
	interestsSchema,
	jobPreferencesSchema,
	photoSchema,
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
	getCurrentUser().set({ id: user.id, name: input.name, image: user.image ?? null });
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
	// Die skakelaar is op /profiel en /tuis. Ververs net die query wat die bladsy gevra het
	// (via `.updates(...)` op die kliënt), sodat niks onnodig bereken word nie.
	await requested(getMyProfile, 1).refreshAll();
	await requested(getHome, 1).refreshAll();
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

export const uploadPhoto = form(photoSchema, async ({ photo }) => {
	const user = requireUser();
	let image: string;
	try {
		image = await photos.uploadProfilePhoto(user.id, photo);
	} catch (e) {
		// 'n 400 van die service (te groot, verkeerde tipe) word 'n boodskap by die vorm,
		// nie 'n foutbladsy nie.
		if (isHttpError(e) && e.status === 400) invalid(e.body.message);
		throw e;
	}
	await getMyProfile().refresh();
	getCurrentUser().set({ id: user.id, name: user.name, image });
	return { saved: true };
});

export const removePhoto = command(async () => {
	const user = requireUser();
	await photos.removeProfilePhoto(user.id);
	await getMyProfile().refresh();
	getCurrentUser().set({ id: user.id, name: user.name, image: null });
});
