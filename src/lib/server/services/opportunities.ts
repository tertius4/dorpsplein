import { formatDate } from '#lib/dates.ts';
import { DB } from '../db/index.ts';
import { JOB_TYPE_LABELS } from './kinds/job.ts';
import { kinds } from './kinds/index.ts';
import { dateRange } from './listings.ts';
import { photoUrl } from './photos.ts';

/** Hoeveel plasings /geleenthede hoogstens wys (nuutste eerste, dan pas-eerste gesorteer). */
const MAX_OPPORTUNITIES = 100;

/**
 * Oop plasings van ander mense waarop `userId` kan reageer. Dié wat by sy belangstellings en
 * werktipes pas, kom eerste (`matches`); dit is net 'n wenk en verberg niks nie.
 * `getListing` (plasings.ts) is die enkele bron vir 'n plasing se besonderhede.
 */
export async function getOpportunities(userId: string) {
	const [listings, interests, jobTypePrefs] = await Promise.all([
		DB.listing.listOpenForMember(userId, MAX_OPPORTUNITIES),
		DB.interest.findByUser(userId),
		DB.jobTypePreference.findByUser(userId)
	]);

	const categoryIds = new Set(interests.map((i) => i.categoryId));
	const prefs = { jobTypes: jobTypePrefs.map((p) => p.jobType) };

	const items = listings
		.filter((l) => l.job)
		.map((l) => ({
			id: l.id,
			title: l.title,
			category: l.category.name,
			icon: l.category.icon,
			jobType: JOB_TYPE_LABELS[l.job!.jobType],
			price: l.price,
			location: l.location,
			when: dateRange(l.startsAt, l.endsAt),
			closesAt: l.closesAt && formatDate(l.closesAt),
			matches:
				categoryIds.has(l.categoryId) &&
				kinds[l.kind].matchesPreferences({ jobType: l.job!.jobType }, prefs),
			owner: {
				id: l.owner.id,
				name: l.owner.name,
				image: photoUrl(l.owner.profile?.photoKey, l.owner.image)
			}
		}));

	// `sort` is stabiel: binne elke groep bly die nuutste eerste.
	return items.sort((a, b) => Number(b.matches) - Number(a.matches));
}
