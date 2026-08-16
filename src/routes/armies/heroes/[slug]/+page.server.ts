import { error } from '@sveltejs/kit';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '$shared/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const hero = server.gameData.heroSlugs.get(slug);
	if (!hero) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, hero, sort: 'score', limit: ARMIES_PAGE_SIZE });
	return { armies, total, name: hero };
};
