import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	event.locals.requireAuth();
}
