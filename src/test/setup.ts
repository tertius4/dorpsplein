// Vitest laai nie `.env` self nie. Sonder die lêer (bv. in CI) slaan die databasistoetse oor.
try {
	process.loadEnvFile('.env');
} catch {
	// geen .env nie
}
