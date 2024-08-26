import { type RequestEvent, redirect, error } from '@sveltejs/kit';

export function hasAuth(event: RequestEvent) {
	return Boolean(event.locals.user);
}

export function requireAuth(event: RequestEvent) {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/login');
	}
	return user;
}

export function hasRoles(event: RequestEvent, ...roles: string[]) {
	const user = event.locals.user;
	return Boolean(user && roles.every((role) => user.roles.includes(role)));
}

export function requireRoles(event: RequestEvent, ...roles: string[]) {
	const user = event.locals.user;
	if (!user || !roles.every((role) => user.roles.includes(role))) {
		return error(403, "You don't have permission to do this warrior!");
	}
	return user;
}
