import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArmies } from "~/lib/server/army";
import { getUser } from "~/lib/server/user";
import z from 'zod';

export const load: PageServerLoad = async (ev) => {
	const { username } = z.object({ username: z.string() }).parse({ username: ev.params.slug });
	const armies = await getArmies({ username });
	const user = await getUser({ username });
	if (!user) {
		return error(404, `Could not find user "${username}"`)
	}
	return { armies, user };
};
