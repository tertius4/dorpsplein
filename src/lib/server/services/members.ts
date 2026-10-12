import { error } from '@sveltejs/kit';
import type { Db } from '../db/create.ts';
import { DB } from '../db/index.ts';

/**
 * Net opgestelde, ongeblokkeerde lede mag plaas of reageer. Lees uit die databasis, nie die koekie nie.
 * `action` voltooi die boodskap: "Jou rekening mag nie … nie".
 */
export async function assertActiveMember(userId: string, db: Db, action: string) {
	const profile = await DB.profile.findByUserId(userId, db);
	if (!profile?.popiaConsentAt) error(403, 'Voltooi eers jou profiel');
	if (profile.blocked) error(403, `Jou rekening mag nie ${action} nie`);
}
