import { error } from '@sveltejs/kit';
import z from 'zod';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const id = z.number().parse(+req.params.slug);

	const server = req.locals.server;
	const army = await server.army.getArmy(req, id, { includeGuideContent: true, includeFullComments: true });
	if (!army) {
		return error(404);
	}

	return { army };
};
