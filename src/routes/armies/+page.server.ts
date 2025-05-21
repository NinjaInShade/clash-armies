import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const server = req.locals.server;
	const armies = await server.army.getArmies(req);
	return { armies };
};
