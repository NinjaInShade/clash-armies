import { GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_SECRET, ORIGIN } from '$app/env/private';

// Originally this used the `arctic` library, however this was deprecated.
// The maintainer provided examples for migration purposes which were followed, e.g.
// - https://github.com/pilcrowonpaper/arctic/blob/5bdc18b0a14e0495ad345f26eb81e300312d0b00/code/authorization_request-pkce.ts
// - https://github.com/pilcrowonpaper/arctic/blob/5bdc18b0a14e0495ad345f26eb81e300312d0b00/code/authorization_code_exchange-pkce.ts

const GOOGLE_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_REDIRECT_URI = `${ORIGIN}/api/login/google/callback`;

/** Thrown when the authorization server rejects a token request (e.g. invalid or expired code) */
export class OAuth2RequestError extends Error {
	public code: string;

	constructor(code: string) {
		super(`OAuth2 request error: ${code}`);
		this.code = code;
	}
}

/**
 * Generate 32 random bytes and encode it into a string with hex encoding (64-character string).
 */
function generateRandomString(): string {
	const randomValues = new Uint8Array(32);
	crypto.getRandomValues(randomValues);
	return randomValues.toHex();
}

export function generateState(): string {
	return generateRandomString();
}

export function generateCodeVerifier(): string {
	return generateRandomString();
}

export async function createGoogleAuthorizationURL(state: string, codeVerifier: string, scopes: string[]): Promise<URL> {
	// Hash the code verifier with SHA-256 and encode it into a string with Base64url.
	const codeVerifierBytes = new TextEncoder().encode(codeVerifier);
	const codeChallengeBuffer = await crypto.subtle.digest('SHA-256', codeVerifierBytes);
	const codeChallenge = new Uint8Array(codeChallengeBuffer).toBase64({ alphabet: 'base64url', omitPadding: true });

	// Use the authorization server's authorization endpoint.
	const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', GOOGLE_AUTH_CLIENT_ID);
	url.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
	url.searchParams.set('state', state);
	url.searchParams.set('code_challenge', codeChallenge);
	url.searchParams.set('code_challenge_method', 'S256');
	url.searchParams.set('scope', scopes.join(' '));

	return url;
}

/** Exchanges an authorization code for an access token */
export async function validateGoogleAuthorizationCode(code: string, codeVerifier: string): Promise<{ accessToken: string }> {
	const body = new URLSearchParams();
	body.set('grant_type', 'authorization_code');
	body.set('code', code);
	body.set('redirect_uri', GOOGLE_REDIRECT_URI);
	body.set('code_verifier', codeVerifier);
	body.set('client_id', GOOGLE_AUTH_CLIENT_ID);
	body.set('client_secret', GOOGLE_AUTH_SECRET);

	const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body,
	});
	// Error responses aren't guaranteed to be JSON (e.g. a 5xx page), so don't let parsing hide the status
	const data: unknown = await response.json().catch(() => null);
	const json = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};

	// An error response could indicate the authorization code is invalid, the request is malformed, or the client credentials are invalid.
	if (response.status !== 200) {
		if (typeof json.error === 'string') {
			throw new OAuth2RequestError(json.error);
		}
		throw new Error(`Unexpected token endpoint response status: ${response.status}`);
	}

	if (typeof json.access_token !== 'string') {
		throw new Error('Expected access token in token endpoint response');
	}

	return { accessToken: json.access_token };
}
