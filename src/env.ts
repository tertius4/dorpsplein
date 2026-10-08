import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Neon-verbinding (gepoel) wat die app gebruik.',
		schema: z.url()
	}
});
