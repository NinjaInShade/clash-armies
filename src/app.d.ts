import type { MySQL } from '@ninjalib/sql';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: MySQL;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
