import { building, dev } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import z from 'zod';

// Secrets aren't available when building (e.g. in the docker image build), so they're only required when the app runs.
// While building they fall back to an empty string, since they're never actually used then.
const requiredString = building ? z.string().default('') : z.string().min(1);

function devOnly<T extends z.ZodType>(schema: T) {
	return dev ? schema : schema.optional();
}
function prodOnly<T extends z.ZodType>(schema: T) {
	return dev || building ? schema.optional() : schema;
}

export const variables = defineEnvVars({
	// Required everywhere
	DB_USER: { schema: requiredString },
	DB_PASSWORD: { schema: requiredString },
	GOOGLE_AUTH_CLIENT_ID: { schema: requiredString },
	GOOGLE_AUTH_SECRET: { schema: requiredString },
	ORIGIN: {
		schema: requiredString,
		description: 'Public facing origin of the app (e.g. https://clasharmies.com in prod), used for the google auth callback URL',
	},
	VISITOR_ID_SECRET: {
		schema: requiredString,
		description: 'Secret used to sign visitor id cookies',
	},
	// Dev only
	DB_PORT: {
		schema: devOnly(z.coerce.number<string>().int()),
		description: 'Database port',
	},
	// Prod only
	DB_HOST: {
		schema: prodOnly(z.string().min(1)),
		description: "Database host, matching the compose file's database service name",
	},
});
