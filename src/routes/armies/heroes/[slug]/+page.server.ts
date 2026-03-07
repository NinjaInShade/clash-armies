import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const hero = server.army.heroSlugs.get(slug);
	if (!hero) {
		return error(404);
	}
	const armies = await server.army.getArmies(req, { hero, sort: 'score' });
	return { armies, name: hero };
};
