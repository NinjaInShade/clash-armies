import { error } from '@sveltejs/kit';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '$shared/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const troopName = server.gameData.troopSlugs.get(slug);
	const troopId = troopName ? server.gameData.troopNames.get(troopName) : undefined;
	if (troopId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, units: [...(query.units ?? []), troopId], sort: 'score', limit: ARMIES_PAGE_SIZE });
	return { armies, total, name: troopName };
};
