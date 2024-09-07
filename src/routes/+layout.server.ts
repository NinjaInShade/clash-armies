import type { LayoutServerLoad } from './$types';
import type { User } from '$types';
import { getTownHalls, getUnits, getEquipment, getPets } from '$server/army';
import { getUser } from '$server/user';

export const load: LayoutServerLoad = async (ev) => {
	let user: User | null = null;
	if (ev.locals.user) {
		user = await getUser(ev.locals, ev.locals.user.username);
	}

	return {
		units: await getUnits(),
		townHalls: await getTownHalls(),
		equipment: await getEquipment(),
		pets: await getPets(),
		user,
	};
};
