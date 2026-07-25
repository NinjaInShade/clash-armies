import type { PageServerLoad } from './$types';
import { ARMIES_PAGE_SIZE } from '$shared/utils';

export const load: PageServerLoad = async (req) => {
	const server = req.locals.server;

	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, limit: ARMIES_PAGE_SIZE });

	return { armies, total };
};
