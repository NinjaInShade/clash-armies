import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArmies, getSavedArmies } from '$server/army';
import { getUser } from '$server/user';
import z from 'zod';

export const load: PageServerLoad = async (req) => {
	req.depends('ca:savedArmies');
	const { username } = z.object({ username: z.string() }).parse({ username: req.params.slug });
	const armies = await getArmies(req, { username });
	const savedArmies = await getSavedArmies(req, { username });
	const user = await getUser(req, username);
	if (!user) {
		return error(404, `Could not find user "${username}"`);
	}
	return { armies, savedArmies, user };
};
