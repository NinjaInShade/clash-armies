import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getArmy } from "~/lib/server/army";
import z from 'zod';

export const load: PageServerLoad = async (ev) => {
	const { id } = z.object({ id: z.number() }).parse({ id: +ev.params.slug });
	const army = await getArmy(id);
	if (!army) {
		return error(404);
	}
	return { army };
};
