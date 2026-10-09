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
	},
	BETTER_AUTH_SECRET: {
		description: 'Ondertekeningsleutel vir sessies en tokens (uniek per omgewing).',
		schema: z.string().min(32)
	},
	BETTER_AUTH_URL: {
		public: true,
		description: 'Publieke basis-URL van die app, bv. https://dorpsplein.co.za',
		schema: z.url()
	},
	RESEND_API_KEY: {
		description: 'Resend-sleutel (net stuur). Leeg plaaslik: e-posse word dan gelog.',
		schema: z.string().optional()
	},
	EMAIL_FROM: {
		description: 'Afsender, bv. Dorpsplein <geen-antwoord@pos.dorpsplein.co.za>',
		schema: z.string().min(3)
	},
	GOOGLE_CLIENT_ID: {
		public: true,
		description: 'Google OAuth-kliënt-ID (een per omgewing).',
		schema: z.string().min(1)
	},
	GOOGLE_CLIENT_SECRET: {
		description: 'Google OAuth-kliëntgeheim.',
		schema: z.string().min(1)
	}
});
