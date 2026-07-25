import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '$shared/utils';
import { parsePageParam } from '$shared/validation';

export const load: PageServerLoad = async (req) => {
	req.depends('ca:savedArmies');
	const username = z.string().parse(req.params.slug);
	const page = parsePageParam(req.url.searchParams.get('page'));
	const savedPage = parsePageParam(req.url.searchParams.get('savedPage'));

	const server = req.locals.server;
	const { armies, total } = await server.army.getArmies(req, { username, limit: ARMIES_PAGE_SIZE, page });
	const { armies: savedArmies, total: savedTotal } = await server.army.getSavedArmies(req, {
		username,
		limit: ARMIES_PAGE_SIZE,
		page: savedPage,
	});

	const user = await server.user.getUser(req, username);
	if (!user) {
		return error(404, `Could not find user "${username}"`);
	}

	return { armies, total, savedArmies, savedTotal, user };
};
