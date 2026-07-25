import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';
import { ARMIES_PAGE_SIZE } from '$shared/utils';

export const load: PageServerLoad = async (req) => {
	const slug = z.string().trim().min(1).parse(req.params.slug);
	const server = req.locals.server;
	const spellName = server.gameData.spellSlugs.get(slug);
	const spellId = spellName ? server.gameData.spellNames.get(spellName) : undefined;
	if (spellId === undefined) {
		return error(404);
	}
	const query = server.army.parseArmyListQuery(req.url.searchParams);
	const { armies, total } = await server.army.getArmies(req, { ...query, units: [...(query.units ?? []), spellId], sort: 'score', limit: ARMIES_PAGE_SIZE });
	return { armies, total, name: spellName };
};
