import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { generateCodeVerifier } from 'arctic';
import { google } from '$server/auth/lucia';
import { dev } from '$app/environment';

export async function GET(req: RequestEvent): Promise<Response> {
	const redirectQuery = req.url.searchParams.get('r');
	const decodedRedirect = decodeURIComponent(redirectQuery || '/');

	if (req.locals.user) {
		// already logged in
		redirect(302, decodedRedirect);
	}

	const state = JSON.stringify({ r: decodedRedirect });
	const codeVerifier = generateCodeVerifier();

	const url = await google.createAuthorizationURL(state, codeVerifier, {
		scopes: ['email'],
	});

	req.cookies.set('google_oauth_state', state, {
		path: '/',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 10, // 10 min
		sameSite: 'lax',
	});

	req.cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 10, // 10 min
		sameSite: 'lax',
	});

	return redirect(302, url.toString());
}
