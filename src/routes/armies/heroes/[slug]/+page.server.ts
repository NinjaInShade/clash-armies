import { decodeUnitName } from '$shared/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { VALID_HEROES } from '~/lib/shared/utils';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const hero = decodeUnitName(z.string().trim().min(1).parse(req.params.slug));
	const server = req.locals.server;
	// @ts-expect-error we don't use type-safe
	// `z.enum` because we want to throw 404.
	if (!VALID_HEROES.includes(hero)) {
		return error(404);
	}
	const armies = await server.army.getArmies(req, { hero, sort: 'score' });
	return { armies };
};
