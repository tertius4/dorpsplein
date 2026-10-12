import { redirect } from '@sveltejs/kit';
import { readIntent } from '#lib/server/intent.ts';

/** Het die gebruiker al op die voorblad gekies? Dan gaan hy reguit na sy vorm. */
export const load = () => {
	const intent = readIntent();
	if (intent) redirect(303, `/begin/${intent}`);
};
