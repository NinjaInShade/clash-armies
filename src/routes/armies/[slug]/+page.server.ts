import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getArmy } from '$server/army';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	const { id } = z.object({ id: z.number() }).parse({ id: +req.params.slug });
	const army = await getArmy(req, id);
	if (!army) {
		return error(404);
	}
	return { army };
};
