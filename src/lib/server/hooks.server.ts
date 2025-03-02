import type { Handle, RequestEvent } from '@sveltejs/kit';
import { db } from '$server/db';
import { migration } from '$server/migration';
import { lucia } from '$server/auth/lucia';
import { hasAuth, requireAuth, hasRoles, requireRoles } from '$server/auth/utils';
import { CronJob } from 'cron';
import { dev } from '$app/environment';
import util from '@ninjalib/util';

util.Logger.showTimestamp = true;
util.Logger.showDate = !dev;

export const log = util.logger('clash-armies:server');

const hourlyTask = new CronJob('0 0 * * * *', async function () {
	await lucia.deleteExpiredSessions();
});

const serverInit = (async () => {
	hourlyTask.start();
	await db.connect();
	await db.migrate(migration);
})();

const serverDispose = async () => {
	hourlyTask.stop();
	await db.dispose();
};

export function getRequestInfo(event: RequestEvent) {
	const { request, locals } = event;
	const { user } = locals;
	return {
		method: request.method,
		url: request.url,
		userId: user?.id,
		username: user?.username,
		ip: event.getClientAddress(),
		userAgent: request.headers.get('User-Agent'),
	};
}

export const handle: Handle = async ({ event, resolve }) => {
	// One-time setup upon starting the server
	await serverInit;

	event.locals.hasAuth = () => hasAuth(event);
	event.locals.requireAuth = () => requireAuth(event);
	event.locals.hasRoles = (...roles: string[]) => hasRoles(event, ...roles);
	event.locals.requireRoles = (...roles: string[]) => requireRoles(event, ...roles);

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		log.info('Incoming request:', getRequestInfo(event));
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	log.info('Incoming request:', getRequestInfo(event));

	return resolve(event);
};

process.on('sveltekit:shutdown', async (reason: 'SIGINT' | 'SIGTERM' | 'IDLE') => {
	console.warn(`Server will be shutting down for reason "${reason}"...`);
	await serverDispose();
	console.warn('Server disposed, shutting down now...');
});
