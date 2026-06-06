import crypto from 'node:crypto';
import type { Session, User } from '$types';
import { db } from '$server/db';
import { dev } from '$app/environment';

// Various implementation functions for session based authentication, following lucia guide(s):
// - https://lucia-auth.com/sessions/basic
// - https://lucia-auth.com/sessions/inactivity-timeout

type CookieAttributes = {
	path: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: 'lax';
	maxAge: number;
};

/**
 * Internal shape of a `sessions` row, including the hashed secret.
 * The secret hash is never exposed beyond this module.
 */
type SessionRow = {
	id: string;
	userId: number;
	/** SHA-256 of the secret, hex-encoded */
	secretHash: string;
	createdAt: Date;
	lastVerifiedAt: Date;
};

/**
 * The set of user fields exposed on `locals.user` for an authenticated request.
 */
export type SessionUser = Pick<User, 'id' | 'username' | 'playerTag' | 'roles'>;

/**
 * Name of the cookie that stores the session token (`<id>.<secret>`).
 */
export const SESSION_COOKIE_NAME = 'session_token';

/**
 * A session expires once it has gone unused (un-verified) for this long.
 * Active users stay signed in indefinitely - idle ones are signed out.
 */
const SESSION_INACTIVITY_TIMEOUT_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * How stale `lastVerifiedAt` is allowed to get before we bump it on use.
 * This throttles writes so we aren't updating the row on every single request.
 */
const SESSION_ACTIVITY_CHECK_INTERVAL_SECONDS = 60 * 60 * 24; // 1 day

// Human readable alphabet (a-z, 0-9 without l, o, 0, 1 to avoid confusion).
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

/**
 * Generates a cryptographically-secure random string.
 */
function generateSecureRandomString(): string {
	// Generate 24 bytes = 192 bits of entropy.
	// We're only going to use 5 bits per byte so the total entropy will be 192 * 5 / 8 = 120 bits
	const bytes = new Uint8Array(24);
	crypto.webcrypto.getRandomValues(bytes);

	let id = '';
	for (let i = 0; i < bytes.length; i++) {
		// >> 3 "removes" the right-most 3 bits of the byte
		id += ALPHABET[bytes[i] >> 3];
	}
	return id;
}

/**
 * Hashes a session secret with SHA-256.
 * A fast hash is fine here because the secret already has 120 bits of entropy and is unguessable.
 */
async function hashSecret(secret: string): Promise<Uint8Array> {
	const secretBytes = new TextEncoder().encode(secret);
	const secretHashBuffer = await crypto.webcrypto.subtle.digest('SHA-256', secretBytes);
	return new Uint8Array(secretHashBuffer);
}

/**
 * Constant-time comparison of two byte arrays,
 * to avoid leaking secrets via comparison timing.
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i];
	}
	return c === 0;
}

/**
 * Creates a new session for a user and returns the `<id>.<secret>` token to hand to the client.
 * Only the hash of the secret is persisted.
 */
export async function createSession(userId: number): Promise<{ token: string; session: Session }> {
	const now = new Date();
	const id = generateSecureRandomString();
	const secret = generateSecureRandomString();
	const secretHash = await hashSecret(secret);

	const token = `${id}.${secret}`;

	await db.insertOne('sessions', {
		id,
		userId,
		secretHash: Buffer.from(secretHash).toString('hex'),
		lastVerifiedAt: now,
		createdAt: now,
	});

	return { token, session: { id, userId, createdAt: now, lastVerifiedAt: now } };
}

/**
 * Validates a session token:
 *   - parses out the id and secret, looks up the session by its (non-secret) id
 *   - then, in constant-time, compares the secret against the stored hash
 *   - finally, bumps `lastVerifiedAt` (throttled) to keep active sessions alive
 */
export async function validateSessionToken(token: string): Promise<Session | null> {
	const now = new Date();

	const tokenParts = token.split('.');
	if (tokenParts.length !== 2) {
		return null;
	}
	const [sessionId, sessionSecret] = tokenParts;

	const session = await getSession(sessionId);
	if (!session) {
		return null;
	}

	const tokenSecretHash = await hashSecret(sessionSecret);
	const validSecret = constantTimeEqual(tokenSecretHash, Buffer.from(session.secretHash, 'hex'));
	if (!validSecret) {
		return null;
	}

	// Slide the session forward once the recorded activity is stale enough.
	if (now.getTime() - session.lastVerifiedAt.getTime() >= SESSION_ACTIVITY_CHECK_INTERVAL_SECONDS * 1000) {
		session.lastVerifiedAt = now;
		await db.query('UPDATE sessions SET lastVerifiedAt = ? WHERE id = ?', [now, sessionId]);
	}

	return { id: session.id, userId: session.userId, lastVerifiedAt: session.lastVerifiedAt, createdAt: session.createdAt };
}

/**
 * Loads a session by its public id, deleting and rejecting
 * it once it has been idle past the inactivity timeout.
 */
async function getSession(sessionId: string): Promise<SessionRow | null> {
	const now = Date.now();

	const row = await db.getRow<SessionRow, null>('sessions', { id: sessionId });
	if (!row) {
		return null;
	}

	const session: SessionRow = {
		id: row.id,
		userId: row.userId,
		secretHash: row.secretHash,
		createdAt: new Date(row.createdAt),
		lastVerifiedAt: new Date(row.lastVerifiedAt),
	};

	if (now - session.lastVerifiedAt.getTime() >= SESSION_INACTIVITY_TIMEOUT_SECONDS * 1000) {
		await invalidateSession(sessionId);
		return null;
	}

	return session;
}

/**
 * Resolves the user attributes exposed on `locals.user` for a validated session.
 */
export async function getSessionUser(userId: number): Promise<SessionUser | null> {
	const user = await db.getRow<User, null>('users', { id: userId });
	if (!user) {
		return null;
	}
	const userRoles = await db.getRows<{ userId: number; role: string }>('user_roles', { userId: user.id });
	return {
		id: user.id,
		username: user.username,
		playerTag: user.playerTag,
		roles: userRoles.map((x) => x.role),
	};
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.query('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

export async function invalidateUserSessions(userId: number): Promise<void> {
	await db.query('DELETE FROM sessions WHERE userId = ?', [userId]);
}

export async function deleteExpiredSessions(): Promise<void> {
	const cutoff = new Date(Date.now() - SESSION_INACTIVITY_TIMEOUT_SECONDS * 1000);
	await db.query('DELETE FROM sessions WHERE lastVerifiedAt <= ?', [cutoff]);
}

/**
 * Cookie attributes for setting an active session cookie.
 * The max-age matches the inactivity timeout, and is re-applied on each authenticated
 * request so the client-side expiry slides forward in step with the server-side one.
 */
export function getSessionCookieAttributes(): CookieAttributes {
	return {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: SESSION_INACTIVITY_TIMEOUT_SECONDS,
	};
}

/**
 * Cookie attributes for clearing the session cookie.
 */
export function getBlankSessionCookieAttributes(): CookieAttributes {
	return {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: 0,
	};
}
