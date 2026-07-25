import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '$shared/utils';

export const load: PageServerLoad = async (req) => {
	const townHall = z.number().parse(+req.params.slug);
	const server = req.locals.server;
	if (!server.gameData.validTownHalls.has(townHall)) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, townHall, sort: 'score', limit: ARMIES_PAGE_SIZE });
	return { armies, total };
};
