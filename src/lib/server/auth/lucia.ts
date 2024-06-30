import { Lucia  } from "lucia";
import { Google } from 'arctic';
import { db } from "~/lib/server/db";
import { sqlAdapter } from "./adapter";
import { dev, building } from "$app/environment";
import { GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET } from '$env/static/private';

const BASE_APP_URL = dev ? 'http://localhost:5173' : process.env.BASE_APP_URL;

if (typeof GOOGLE_AUTH_CLIENT_ID !== 'string') {
    throw new Error('Expected google auth client id to be defined');
}
if (typeof GOOGLE_AUTH_SECRET !== 'string') {
    throw new Error('Expected google auth secret to be defined');
}
if (!building && !dev && typeof BASE_APP_URL !== 'string') {
	throw new Error('Expected base app url to be defined in production');
}

const adapter = new sqlAdapter(db);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
    getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			playerTag: attributes.playerTag,
			roles: attributes.roles,
		};
	}
});

export const google = new Google(GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET, `${BASE_APP_URL}/login/google/callback`);

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
        UserId: number;
        DatabaseUserAttributes: {
            username: string;
            googleId: string;
            playerTag: string | null;
			roles: string[];
        };
	}
}
