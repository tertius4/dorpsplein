import { BETTER_AUTH_URL } from '$app/env/public';
import { DB } from '../db/index.ts';
import { photoUrl } from './photos.ts';

/** Alles wat /tuis wys, reeds in vertoonvorm. */
export async function getHomeOverview(
	userId: string,
	user: { name: string; image?: string | null }
) {
	const [profile, interests, qualificationCount] = await Promise.all([
		DB.profile.findByUserId(userId),
		DB.interest.findByUser(userId),
		DB.qualification.countByUser(userId)
	]);

	// Wat 'n profiel sterk maak, met 'n skakel na die regte afdeling van /profiel.
	const checklist = [
		{
			label: 'Laai ’n foto op',
			done: Boolean(profile?.photoKey || user.image),
			href: '/profiel#foto'
		},
		{
			label: 'Beskryf jouself in een sin',
			done: Boolean(profile?.headline),
			href: '/profiel#oor-my'
		},
		{ label: 'Vertel meer oor jouself', done: Boolean(profile?.bio), href: '/profiel#oor-my' },
		{
			label: 'Voeg jare ervaring by',
			done: interests.some((i) => i.yearsExperience !== null),
			href: '/profiel#belangstellings'
		},
		{
			label: 'Voeg ’n kwalifikasie by',
			done: qualificationCount > 0,
			href: '/profiel#kwalifikasies'
		}
	];

	return {
		name: user.name,
		firstName: user.name.trim().split(/\s+/)[0],
		image: photoUrl(profile?.photoKey, user.image),
		available: profile?.available ?? true,
		publicProfile: profile?.publicProfile ?? true,
		profileUrl: `${BETTER_AUTH_URL}/mense/${userId}`,
		checklist,
		done: checklist.filter((item) => item.done).length
	};
}
