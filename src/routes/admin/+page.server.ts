import type { PageServerLoad } from './$types';
import { getTownHalls, getUnits } from '$server/army';

export const load: PageServerLoad = async (req) => {
	req.locals.requireRoles('admin');

	return {
		units: await getUnits(),
		townHalls: await getTownHalls(),
	};
};
