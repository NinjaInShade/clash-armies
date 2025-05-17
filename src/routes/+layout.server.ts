import type { LayoutServerLoad } from './$types';
import type { User, ArmyNotification } from '$types';
import { getTownHalls, getUnits, getEquipment, getPets } from '$server/army';
import { getUser } from '$server/user';
import { getNotifications } from '$server/notifications';

export const load: LayoutServerLoad = async (req) => {
	let user: User | null = null;
	let userNotifications: ArmyNotification[] | null = null;

	if (req.locals.user) {
		user = await getUser(req, req.locals.user.username);
	}
	if (user) {
		userNotifications = await getNotifications(user.id);
	}

	return {
		units: await getUnits(),
		townHalls: await getTownHalls(),
		equipment: await getEquipment(),
		pets: await getPets(),
		user,
		userNotifications,
	};
};
