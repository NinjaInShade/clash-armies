import { GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET, ORIGIN } from '$app/env/private';
import { Google } from 'arctic';

export const google = new Google(GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET, `${ORIGIN}/api/login/google/callback`);
