import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const equipment = server.gameData.equipmentSlugs.get(slug);
	if (!equipment) {
		return error(404);
	}
	const armies = await server.army.getArmies(req, { equipment, sort: 'score' });
	return { armies, name: equipment };
};
