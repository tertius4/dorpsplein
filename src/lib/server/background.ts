import { waitUntil } from 'cloudflare:workers';

/**
 * Laat 'n taak ná die antwoord voortgaan. Op Workers hou `waitUntil` die
 * Worker lewendig totdat die taak klaar is; foute word gelog, nie gegooi nie.
 *
 * LET WEL: adapter-cloudflare 8 gee nie `event.platform` deur nie, so `waitUntil` kom uit
 * `cloudflare:workers`. In `npm run dev` is dit 'n no-op, maar Node laat die belofte in
 * elk geval klaar loop.
 */
export function runInBackground(task: Promise<unknown>) {
	waitUntil(task.catch((error) => console.error('[agtergrond]', error)));
}
