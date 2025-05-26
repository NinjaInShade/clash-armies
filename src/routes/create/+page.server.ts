import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	redirect(308, '/army-builder');
};
