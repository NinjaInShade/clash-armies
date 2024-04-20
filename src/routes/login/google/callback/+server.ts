import type { RequestEvent } from "@sveltejs/kit";
import { OAuth2RequestError } from "arctic";
import type { User } from "~/lib/shared/types";
import { google, lucia } from "~/lib/server/auth/lucia";
import { db } from "~/lib/server/db";

type GoogleUser = {
	sub: string;
	picture: string;
}

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");

	const storedState = event.cookies.get("google_oauth_state") ?? null;
	const storedCodeVerifier = event.cookies.get("google_oauth_code_verifier") ?? null;

    if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
        return new Response(null, {
			status: 400
		});
    }

	try {
        const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
        const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`
            }
        });
        const googleUser: GoogleUser = await response.json();
        const googleId = googleUser.sub;

        const existingUser = await db.getRow<User>('users', { googleId })
		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `/users/${existingUser.username}`
                }
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
                })
                await tx.insertOne('user_roles', { userId, role: 'user' });
            })
            if (!userId) {
                throw new Error('Expected user id');
            }

            const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
            return new Response(null, {
                status: 302,
                headers: {
                    Location: `/users/${username}`
                }
            });
        }
	} catch (err) {
        console.log('Error whilst authenticating:', err);
		if (err instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}
