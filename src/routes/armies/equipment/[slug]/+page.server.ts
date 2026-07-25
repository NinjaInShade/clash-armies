import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const equipmentName = server.gameData.equipmentSlugs.get(slug);
	const equipmentId = equipmentName ? server.gameData.equipmentNames.get(equipmentName) : undefined;
	if (equipmentId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const armies = await server.army.getArmies(req, { ...query, equipments: [...(query.equipments ?? []), equipmentId], sort: 'score' });
	return { armies, name: equipmentName };
};
