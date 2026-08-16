import type { RequestEvent } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';
import { google } from '$server/auth/oauth';
import { createSession, SESSION_COOKIE_NAME, getSessionCookieAttributes } from '$server/auth/session';
import { log } from '$server/auth/utils';
import { db } from '$server/db';

type GoogleUser = {
	sub: string;
	picture: string;
	email?: string;
	email_verified?: string;
};

function isObject(obj: unknown): obj is Record<string, unknown> {
	return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}

export async function GET(req: RequestEvent): Promise<Response> {
	const code = req.url.searchParams.get('code');
	const state = req.url.searchParams.get('state');

	const storedState = req.cookies.get('google_oauth_state') ?? null;
	const storedCodeVerifier = req.cookies.get('google_oauth_code_verifier') ?? null;

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400,
		});
	}

	let parsedState: unknown;
	let redirect: string | null = null;

	try {
		parsedState = JSON.parse(state);
	} catch {
		// Pass
	}

	if (isObject(parsedState) && parsedState.r && typeof parsedState.r === 'string') {
		redirect = parsedState.r;
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const accessToken = tokens.accessToken();
		const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		const googleUser: GoogleUser = await response.json();
		const googleId = googleUser.sub;
		const googleEmail = googleUser.email ?? null;

		const existingUser = await db.selectFrom('users').where('googleId', '=', googleId).selectAll().executeTakeFirst();
		if (existingUser) {
			if (googleEmail) {
				await db.transaction().execute(async (tx) => {
					await tx.updateTable('users').set({ googleEmail }).where('id', '=', existingUser.id).execute();
				});
			}
			const { token } = await createSession(existingUser.id);
			req.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieAttributes());
			return new Response(null, {
				status: 302,
				headers: {
					Location: redirect || `/users/${existingUser.username}`,
				},
			});
		} else {
			const { userId, username } = await db.transaction().execute(async (tx) => {
				// default username, user will be able to change this after (TODO: in the future allow user to set username on creation)
				const maxIdResult = await db
					.selectFrom('users')
					.select((eb) => eb.fn.max('id').as('maxId'))
					.executeTakeFirst();
				const maxId = maxIdResult?.maxId ?? 0;
				const username = `Warrior-${maxId + 1}`;

				const userResult = await tx.insertInto('users').values({ username, googleId, googleEmail }).executeTakeFirst();
				const userId = Number(userResult.insertId);
				await tx.insertInto('user_roles').values({ userId, role: 'user' }).execute();
				return { userId, username };
			});

			const { token } = await createSession(userId);
			req.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieAttributes());
			return new Response(null, {
				status: 302,
				headers: {
					Location: redirect || `/users/${username}`,
				},
			});
		}
	} catch (err) {
		log.error('Failed authentication:', {
			requestId: req.locals.uuid,
			error: err,
		});

		if (err instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400,
			});
		}
		return new Response(null, {
			status: 500,
		});
	}
}
