import { Google } from 'arctic';
import { dev, building } from '$app/environment';
import { env } from '$env/dynamic/private';

const { GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET, ORIGIN } = env;

if (!building) {
	if (typeof GOOGLE_AUTH_CLIENT_ID !== 'string') {
		throw new Error('Expected google auth client id to be defined');
	}
	if (typeof GOOGLE_AUTH_SECRET !== 'string') {
		throw new Error('Expected google auth secret to be defined');
	}
	if (!dev && typeof ORIGIN !== 'string') {
		throw new Error('Expected base app url to be defined in production');
	}
}

export const google = new Google(GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET, `${ORIGIN}/api/login/google/callback`);
