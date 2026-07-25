import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const siegeName = server.gameData.siegeSlugs.get(slug);
	const siegeId = siegeName ? server.gameData.siegeNames.get(siegeName) : undefined;
	if (siegeId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const armies = await server.army.getArmies(req, { ...query, units: [...(query.units ?? []), siegeId], sort: 'score' });
	return { armies, name: siegeName };
};
