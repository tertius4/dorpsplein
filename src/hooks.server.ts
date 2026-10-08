import type { HandleServerError } from '@sveltejs/kit/hooks';

export const handleError: HandleServerError = ({ kind, error, event }) => {
	// App-, raamwerk- (bv. 404) en validasiefoute het reeds 'n veilige boodskap.
	if (kind !== 'unknown') return;

	console.error(`[${event.request.method} ${event.url.pathname}]`, error);
	return { message: 'Iets het verkeerd geloop' };
};
