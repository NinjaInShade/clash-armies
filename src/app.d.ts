import type { User, Session } from 'lucia';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/**
			 * Use this to protect server load and action functions against un-authenticated users
			 *
			 * Redirects user to `/login` if they aren't authenticated.
			 */
			requireAuth: () => void;
			user: User | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
