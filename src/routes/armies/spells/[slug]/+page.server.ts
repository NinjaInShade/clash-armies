import { decodeUnitName } from '$shared/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const spell = decodeUnitName(z.string().trim().min(1).parse(req.params.slug));
	const server = req.locals.server;
	if (!server.army.spellNames.has(spell)) {
		return error(404);
	}
	const armies = await server.army.getArmies(req, { unit: spell, sort: 'score' });
	return { armies };
};
