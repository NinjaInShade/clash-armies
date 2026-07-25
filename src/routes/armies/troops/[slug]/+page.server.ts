import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const troopName = server.gameData.troopSlugs.get(slug);
	const troopId = troopName ? server.gameData.troopNames.get(troopName) : undefined;
	if (troopId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const armies = await server.army.getArmies(req, { ...query, units: [...(query.units ?? []), troopId], sort: 'score' });
	return { armies, name: troopName };
};
