import { z } from 'zod';
import { requestId } from './fields.ts';
import { optionalText } from './listing.ts';

/** "Ek is beskikbaar": die plasing en 'n opsionele nota ("Kan eers 09:00 begin"). */
export const respondSchema = z.object({
	requestId,
	listingId: z.string().min(1).max(64),
	note: optionalText(300)
});

/** Onttrek, aanvaar of wys af: net die reaksie en 'n `requestId`. */
export const responseActionSchema = z.object({ requestId, id: z.string().min(1).max(64) });

export type RespondInput = z.output<typeof respondSchema>;
