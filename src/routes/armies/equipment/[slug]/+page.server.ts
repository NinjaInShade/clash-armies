import { error } from '@sveltejs/kit';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '$shared/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const equipmentName = server.gameData.equipmentSlugs.get(slug);
	const equipmentId = equipmentName ? server.gameData.equipmentNames.get(equipmentName) : undefined;
	if (equipmentId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, {
		...query,
		equipments: [...(query.equipments ?? []), equipmentId],
		sort: 'score',
		limit: ARMIES_PAGE_SIZE,
	});
	return { armies, total, name: equipmentName };
};
