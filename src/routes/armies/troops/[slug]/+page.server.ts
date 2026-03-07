import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const troop = server.army.troopSlugs.get(slug);
	if (!troop) {
		return error(404);
	}
	const armies = await server.army.getArmies(req, { unit: troop, sort: 'score' });
	return { armies, name: troop };
};
