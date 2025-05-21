import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	req.depends('ca:savedArmies');
	const username = z.string().parse(req.params.slug);

	const server = req.locals.server;
	const armies = await server.army.getArmies(req, { username });
	const savedArmies = await server.army.getSavedArmies(req, { username });

	const user = await server.user.getUser(req, username);
	if (!user) {
		return error(404, `Could not find user "${username}"`);
	}

	return { armies, savedArmies, user };
};
