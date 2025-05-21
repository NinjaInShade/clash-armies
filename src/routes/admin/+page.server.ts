import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	req.locals.requireRoles('admin');

	const { server } = req.locals;

	return {
		units: server.army.units,
		townHalls: server.army.townHalls,
	};
};
