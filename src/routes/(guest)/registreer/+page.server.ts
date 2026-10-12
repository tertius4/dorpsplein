import { isIntent, setIntent } from '#lib/server/intent.ts';
import type { PageServerLoad } from './$types';

/** `/registreer?as=werker|plaser` kom van die voorblad; onthou dit vir /begin. */
export const load: PageServerLoad = ({ url }) => {
	const intent = url.searchParams.get('as');
	if (isIntent(intent)) setIntent(intent);
};
