import type { PageServerLoad } from './$types';
import { getArmies, getTownHalls } from '~/lib/server/army';

export const load: PageServerLoad = async (ev) => {
	const armies = await getArmies({ req: ev.locals });
	const townHalls = await getTownHalls();
	return { armies, townHalls };
};
