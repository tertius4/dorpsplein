import { error } from '@sveltejs/kit';
import { DB, type JobType } from '../db/index.ts';
import { JOB_TYPE_LABELS } from './kinds/job.ts';

/** "Jan Botha" → "Jan B." vir besoekers wat nie aangemeld is nie. */
export function displayName(name: string, isMember: boolean) {
	if (isMember) return name;
	const parts = name.trim().split(/\s+/);
	if (parts.length < 2) return parts[0];
	return `${parts[0]} ${parts.at(-1)![0].toUpperCase()}.`;
}

const MONTHS = [
	'Januarie',
	'Februarie',
	'Maart',
	'April',
	'Mei',
	'Junie',
	'Julie',
	'Augustus',
	'September',
	'Oktober',
	'November',
	'Desember'
];

/**
 * Die publieke profiel van `userId`, soos `viewerId` dit mag sien (null = nie aangemeld nie).
 * Die navraag (`DB.user.findPublicProfile`) lees net 'n witlys van velde; hier is die reëls.
 */
export async function getPublicProfile(userId: string, viewerId: string | null) {
	const user = await DB.user.findPublicProfile(userId);

	const isMember = viewerId !== null;
	const profile = user?.profile;

	// Een 404 vir alles: bestaan nie, nie aanboord nie, geblokkeer, of privaat vir besoekers.
	// So kan niemand aflei dat 'n rekening bestaan nie.
	const visible =
		user &&
		profile &&
		profile.popiaConsentAt !== null &&
		!profile.blocked &&
		(profile.publicProfile || isMember);
	if (!visible) error(404, 'Hierdie profiel bestaan nie of is nie sigbaar nie');

	const jobTypes = new Set<JobType>(user.jobTypePrefs.map((p) => p.jobType));

	return {
		id: user.id,
		name: displayName(user.name, isMember),
		image: user.image,
		isOwn: viewerId === user.id,
		isPublic: profile.publicProfile,
		memberSince: `${MONTHS[user.createdAt.getMonth()]} ${user.createdAt.getFullYear()}`,
		headline: profile.headline,
		bio: profile.bio,
		available: profile.available,
		driversLicence: user.workerProfile?.driversLicence ?? false,
		ownTransport: user.workerProfile?.ownTransport ?? false,
		interests: user.interests.map((i) => ({
			name: i.category.name,
			icon: i.category.icon,
			yearsExperience: i.yearsExperience
		})),
		jobTypes: (Object.keys(JOB_TYPE_LABELS) as JobType[])
			.filter((t) => jobTypes.has(t))
			.map((t) => JOB_TYPE_LABELS[t]),
		qualifications: user.qualifications
	};
}
