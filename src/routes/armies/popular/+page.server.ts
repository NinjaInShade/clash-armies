import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const server = req.locals.server;
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const armies = await server.army.getArmies(req, { ...query, sort: 'score' });
	return { armies };
};
