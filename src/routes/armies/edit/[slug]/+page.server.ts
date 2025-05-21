import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const id = z.number().parse(+req.params.slug);

	const server = req.locals.server;
	const army = await server.army.getArmy(req, id);
	if (!army) {
		return error(404);
	}

	return { army };
};
