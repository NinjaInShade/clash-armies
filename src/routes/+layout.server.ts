import type { LayoutServerLoad } from './$types';
import { getTownHalls, getUnits } from "~/lib/server/army";

export const load: LayoutServerLoad = async () => {
	return {
		townHalls: await getTownHalls(),
		units: await getUnits(),
	};
};
