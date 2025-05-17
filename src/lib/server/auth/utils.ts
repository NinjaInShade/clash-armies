import { type RequestEvent, redirect, error } from '@sveltejs/kit';
import util from '@ninjalib/util';

export const log = util.logger('clash-armies:auth');

export function hasAuth(req: RequestEvent) {
	return Boolean(req.locals.user);
}

export function requireAuth(req: RequestEvent) {
	const user = req.locals.user;
	if (!user) {
		const redirectQuery = `${req.url.pathname}${req.url.search}`;
		const encodedRedirect = encodeURIComponent(redirectQuery);
		redirect(302, `/login?r=${encodedRedirect}`);
	}
	return user;
}

export function hasRoles(req: RequestEvent, ...roles: string[]) {
	const user = req.locals.user;
	return Boolean(user && roles.every((role) => user.roles.includes(role)));
}

export function requireRoles(req: RequestEvent, ...roles: string[]) {
	const user = req.locals.requireAuth();
	if (!roles.every((role) => user.roles.includes(role))) {
		return error(403, "You don't have permission to do this warrior!");
	}
	return user;
}
