import type { PageServerLoad } from './$types';
import { getArmies } from '$server/army';

export const load: PageServerLoad = async (ev) => {
	const armies = await getArmies({ req: ev.locals });
	return { armies };
};
