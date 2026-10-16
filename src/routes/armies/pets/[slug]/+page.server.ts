import { error } from '@sveltejs/kit';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '#shared/utils.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const pet = server.gameData.index.pets.bySlug(slug);
	if (!pet) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, pets: [...(query.pets ?? []), pet.id], sort: 'score', limit: ARMIES_PAGE_SIZE });
	return { armies, total, name: pet.name };
};
