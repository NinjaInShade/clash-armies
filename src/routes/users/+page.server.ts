import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	req.locals.requireAuth();
};
