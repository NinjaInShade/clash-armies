import type { PageServerLoad } from './$types';
import { getArmies, getTownHalls } from '$server/army';

export const load: PageServerLoad = async (req) => {
	const armies = await getArmies(req);
	const townHalls = await getTownHalls();
	return { armies, townHalls };
};
