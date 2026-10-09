import { getRequestEvent } from '$app/server';

/**
 * Laat 'n taak ná die antwoord voortgaan. Op Workers hou `waitUntil` die
 * Worker lewendig totdat die taak klaar is; foute word gelog, nie gegooi nie.
 */
export function runInBackground(task: Promise<unknown>) {
	const logged = task.catch((error) => console.error('[agtergrond]', error));
	const { platform } = getRequestEvent();
	if (!platform) return;

	platform.ctx.waitUntil(logged);
}
