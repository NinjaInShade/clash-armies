import { ARMIES_PAGE_SIZE } from '$shared/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const server = req.locals.server;
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, limit: ARMIES_PAGE_SIZE });
	return { armies, total };
};
