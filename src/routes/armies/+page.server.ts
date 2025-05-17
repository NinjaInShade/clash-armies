import type { PageServerLoad } from './$types';
import { getArmies } from '$server/army';

export const load: PageServerLoad = async (req) => {
	const armies = await getArmies(req);
	return { armies };
};
