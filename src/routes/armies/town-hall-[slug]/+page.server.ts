import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const townHall = z.number().parse(+req.params.slug);
	const server = req.locals.server;
	const armies = await server.army.getArmies(req, { townHall, sort: 'score' });
	return { armies };
};
