import type { LayoutServerLoad } from './$types';
import type { User, ArmyNotification } from '$types';

export const load: LayoutServerLoad = async (req) => {
	const { server } = req.locals;

	let user: User | null = null;
	let userNotifications: ArmyNotification[] | null = null;

	if (req.locals.user) {
		user = await server.user.getUser(req, req.locals.user.username);
	}
	if (user) {
		userNotifications = await server.notification.getNotifications(req, { userId: user.id });
	}

	return {
		units: server.gameData.units,
		equipment: server.gameData.equipment,
		pets: server.gameData.pets,
		townHalls: server.gameData.townHalls,
		heroes: server.gameData.heroes,
		user,
		userNotifications,
	};
};
