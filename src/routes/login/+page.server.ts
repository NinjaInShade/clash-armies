import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	if (req.locals.user) {
		redirect(302, '/');
	}
};
