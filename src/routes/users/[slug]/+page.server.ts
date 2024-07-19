import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArmies, getSavedArmies } from '~/lib/server/army';
import { getUser } from '~/lib/server/user';
import z from 'zod';

export const load: PageServerLoad = async (ev) => {
	ev.depends('ca:savedArmies');
	const { username } = z.object({ username: z.string() }).parse({ username: ev.params.slug });
	const armies = await getArmies({ req: ev.locals, username });
	const savedArmies = await getSavedArmies({ req: ev.locals, username });
	const user = await getUser(ev.locals, username);
	if (!user) {
		return error(404, `Could not find user "${username}"`);
	}
	return { armies, savedArmies, user };
};
