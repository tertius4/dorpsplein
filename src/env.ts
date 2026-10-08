import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Neon-verbinding (gepoel) wat die app gebruik.',
		schema: z.url()
	},
	APP_ENV: {
		public: true,
		description: 'Waar die app loop: production, dev of local',
		schema: z.enum(['production', 'dev', 'local']).default('local')
	}
});
