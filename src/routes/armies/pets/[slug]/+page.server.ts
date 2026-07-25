import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const petName = server.gameData.petSlugs.get(slug);
	const petId = petName ? server.gameData.petNames.get(petName) : undefined;
	if (petId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const armies = await server.army.getArmies(req, { ...query, pets: [...(query.pets ?? []), petId], sort: 'score' });
	return { armies, name: petName };
};
