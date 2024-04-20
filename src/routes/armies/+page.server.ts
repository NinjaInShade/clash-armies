import type { PageServerLoad } from './$types';
import { getArmies, getTownHalls } from "~/lib/server/army";

export const load: PageServerLoad = async () => {
	const armies = await getArmies();
	const townHalls = await getTownHalls();
	return { armies, townHalls };
};
