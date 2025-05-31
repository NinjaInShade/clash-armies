import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (req) => {
	if (req.locals.user) {
		redirect(302, '/');
	}
};
