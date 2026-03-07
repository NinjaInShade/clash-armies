import { decodeUnitName } from '$shared/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const equipment = decodeUnitName(z.string().trim().min(1).parse(req.params.slug));
	const server = req.locals.server;
	if (!server.army.equipmentNames.has(equipment)) {
		return error(404);
	}
	const armies = await server.army.getArmies(req, { equipment, sort: 'score' });
	return { armies };
};
