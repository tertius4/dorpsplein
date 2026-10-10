import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { JOB_TYPES } from '#lib/schemas/fields.ts';
import type { InterestsInput, QualificationInput } from '#lib/schemas/profile.ts';
import { auth } from '../auth.ts';
import { DB, type JobType } from '../db/index.ts';
import { JOB_TYPE_LABELS } from './kinds/job.ts';

export const MAX_QUALIFICATIONS = 20;

/** "+27821234567" → "082 123 4567" vir vertoning. */
export function formatPhone(phone: string | null | undefined) {
	if (!phone) return '';
	const local = phone.replace(/^\+27/, '0');
	return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** Gooi 400 as enige ID nie 'n aktiewe werk-kategorie is nie (gepeuter). */
export async function assertActiveJobCategories(ids: number[]) {
	const active = new Set((await DB.category.findActive('JOB')).map((c) => c.id));
	if (!ids.every((id) => active.has(id))) error(400, 'Ongeldige kategorie');
}

/** Alles wat /profiel wys, reeds in vertoonvorm. */
export async function getMyProfile(userId: string) {
	const { user } = getRequestEvent().locals;

	// Onafhanklike navrae tegelyk: een rondte na Neon in plaas van vyf.
	const [profile, interests, jobTypePrefs, worker, categories, qualifications] = await Promise.all([
		DB.profile.findByUserId(userId),
		DB.interest.findByUser(userId),
		DB.jobTypePreference.findByUser(userId),
		DB.workerProfile.findByUser(userId),
		DB.category.findActive('JOB'),
		DB.qualification.findByUser(userId)
	]);

	const years = new Map(interests.map((i) => [i.categoryId, i.yearsExperience]));
	const wanted = new Set<JobType>(jobTypePrefs.map((p) => p.jobType));

	return {
		id: userId,
		name: user?.name ?? '',
		email: user?.email ?? '',
		headline: profile?.headline ?? '',
		bio: profile?.bio ?? '',
		phone: formatPhone(profile?.phone),
		available: profile?.available ?? true,
		publicProfile: profile?.publicProfile ?? true,
		interests: categories.map((c) => ({
			categoryId: String(c.id),
			name: c.name,
			icon: c.icon,
			selected: years.has(c.id),
			years: years.get(c.id)?.toString() ?? ''
		})),
		jobTypes: JOB_TYPES.map((value) => ({
			value,
			label: JOB_TYPE_LABELS[value],
			selected: wanted.has(value)
		})),
		driversLicence: worker?.driversLicence ?? false,
		ownTransport: worker?.ownTransport ?? false,
		qualifications: qualifications.map(({ id, name, issuer, year }) => ({
			id,
			name,
			issuer,
			year
		})),
		canAddQualification: qualifications.length < MAX_QUALIFICATIONS
	};
}

export async function updateAbout(
	userId: string,
	input: { name: string; headline?: string; bio?: string; phone: string }
) {
	// Die naam woon in Better Auth se `User`. Deur Better Auth te gaan, word die sessiekoekie
	// (cookieCache) ook dadelik bygewerk, sodat die kopstrook nie 5 minute die ou naam wys nie.
	await auth().api.updateUser({
		body: { name: input.name },
		headers: getRequestEvent().request.headers
	});
	await DB.profile.upsert(userId, {
		headline: input.headline || null,
		bio: input.bio || null,
		phone: input.phone
	});
}

export async function updateInterests(userId: string, items: InterestsInput) {
	await assertActiveJobCategories(items.map((i) => i.categoryId));
	await DB.$transaction((tx) => DB.interest.syncForUser(userId, items, tx));
}

export async function updateJobPreferences(
	userId: string,
	input: { jobTypes: JobType[]; driversLicence?: boolean; ownTransport?: boolean }
) {
	await DB.$transaction(async (tx) => {
		await DB.jobTypePreference.replaceForUser(userId, input.jobTypes, tx);
		await DB.workerProfile.upsert(
			userId,
			{ driversLicence: input.driversLicence ?? false, ownTransport: input.ownTransport ?? false },
			tx
		);
	});
}

export async function setAvailable(userId: string, available: boolean) {
	await DB.profile.update(userId, { available });
}

export async function setPublicProfile(userId: string, publicProfile: boolean) {
	await DB.profile.update(userId, { publicProfile });
}

export async function addQualification(userId: string, input: QualificationInput) {
	const isAdded = await DB.qualification.countByUser(userId);
	if (isAdded >= MAX_QUALIFICATIONS) {
		error(400, `Jy kan hoogstens ${MAX_QUALIFICATIONS} kwalifikasies hê`);
	}
	await DB.qualification.create(userId, {
		name: input.name,
		issuer: input.issuer || null,
		year: input.year ? Number(input.year) : null
	});
}

export async function removeQualification(userId: string, id: string) {
	// 404, nie 403 nie: ons verklap nie dat 'n ander persoon se ID bestaan nie.
	const isDeleted = await DB.qualification.deleteOwned(id, userId);
	if (!isDeleted) error(404, 'Kwalifikasie nie gevind nie');
}
