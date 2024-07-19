import type { User, Session } from 'lucia';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals extends Request {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	declare const __CHANGELOG__: string
}

export interface Request {
	/**
	 * Returns true if user is authenticated.
	 */
	hasAuth: () => boolean;
	/**
	 * Ensures user is authenticated and returns their user object. Redirects to `login` if un-authenticated.
	 */
	requireAuth: () => User;
	/**
	 * Returns true if user is authenticated and has every role specified.
	 */
	hasRoles: (...roles: string[]) => boolean;
	/**
	 * Ensures user is authenticated and has all roles specified. Throws `403` if user doesn't any of the role/s .
	 */
	requireRoles: (...roles: string[]) => User;
	user: User | null;
	session: Session | null;
}

export {};
