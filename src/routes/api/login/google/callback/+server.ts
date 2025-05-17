import type { RequestEvent } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';
import type { User } from '$types';
import { google, lucia } from '$server/auth/lucia';
import { db } from '$server/db';
import { log } from '$server/auth/utils';

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

	if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400,
		});
	}

	let parsedState: unknown;
	let redirect: string | null = null;

	try {
		parsedState = JSON.parse(state);
	} catch (err) {
		// Pass
	}

	if (isObject(parsedState) && parsedState.r && typeof parsedState.r === 'string') {
		redirect = parsedState.r;
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
		const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});
		const googleUser: GoogleUser = await response.json();
		const googleId = googleUser.sub;
		const googleEmail = googleUser.email;

		const existingUser = await db.getRow<User>('users', { googleId });
		if (existingUser) {
			if (googleEmail) {
				await db.transaction(async (tx) => {
					// prettier-ignore
					await tx.query(`
                        UPDATE users
                        SET googleEmail = ?
                        WHERE id = ?
                    `, [existingUser.id, googleUser.email ?? null])
				});
			}
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			req.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
			return new Response(null, {
				status: 302,
				headers: {
					Location: redirect || `/users/${existingUser.username}`,
				},
			});
		} else {
			// default username, user will be able to change this after (TODO: in the future allow user to set username on creation)
			const maxId = (await db.query<{ maxId: number }>('SELECT MAX(id) AS maxId FROM users'))[0].maxId;
			const username = `Warrior-${maxId + 1}`;

			let userId: number | null = null;
			await db.transaction(async (tx) => {
				userId = await tx.insertOne('users', {
					username,
					googleId,
					googleEmail,
				});
				await tx.insertOne('user_roles', { userId, role: 'user' });
			});
			if (!userId) {
				throw new Error('Expected user id');
			}

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			req.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes,
			});
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
