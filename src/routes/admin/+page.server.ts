import type { PageServerLoad } from './$types';
import { getTownHalls, getUnits } from "~/lib/server/army";

export const load: PageServerLoad = async () => {
	return {
        units: await getUnits(),
        townHalls: await getTownHalls()
    };
};
