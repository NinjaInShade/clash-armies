import type { Handle, RequestEvent } from '@sveltejs/kit';
import { db } from '$server/db';
import { migration } from '$server/migration';
import { lucia } from '$server/auth/lucia';
import { hasAuth, requireAuth, hasRoles, requireRoles } from '$server/auth/utils';
import { v4 as uuidv4 } from 'uuid';
import { CronJob } from 'cron';
import { dev } from '$app/environment';
import util from '@ninjalib/util';

util.Logger.showTimestamp = true;
util.Logger.showDate = !dev;

export const log = util.logger('clash-armies:server');

async function hourlyTask() {
	log.info('Deleting expired sessions...');
	await lucia.deleteExpiredSessions();
	log.info('Successfully deleted expired sessions');

	log.info('Deleting old notifications...');
	const deletedNotifications = (await db.query('DELETE FROM army_notifications WHERE timestamp < NOW() - INTERVAL 3 MONTH'))?.affectedRows ?? '<unknown>';
	log.info(`Deleted ${deletedNotifications} old notification${deletedNotifications !== 1 ? 's' : ''}`);
}

const hourlyTaskJob = new CronJob('0 0 * * * *', async function () {
	log.info('Running hourly task...');
	await hourlyTask();
	log.info('Finished hourly task');
});

const serverInit = (async () => {
	await db.connect();
	await db.migrate(migration);
	await hourlyTask();
	hourlyTaskJob.start();
})();

const serverDispose = async () => {
	hourlyTaskJob.stop();
	await db.dispose();
};

export function getRequestInfo(event: RequestEvent) {
	const { request, locals } = event;
	const { user, uuid } = locals;
	const { method, url } = request;
	return {
		uuid,
		method,
		url,
		userId: user?.id,
		username: user?.username,
		ip: event.getClientAddress(),
		userAgent: request.headers.get('User-Agent'),
	};
}

function getResponseInfo(request: ReturnType<typeof getRequestInfo>, response: Response) {
	const { uuid, method } = request;
	const { status } = response;
	return { requestId: uuid, method, status };
}

export const handle: Handle = async ({ event, resolve }) => {
	async function handleWithLogging() {
		const start = Date.now();
		const requestInfo = getRequestInfo(event);
		log.info('Request:', requestInfo);

		// Runs the request handler
		const response = await resolve(event);

		const requestDuration = Date.now() - start;
		const responseInfo = getResponseInfo(requestInfo, response);
		log.info('Response:', { ...responseInfo, duration: `${requestDuration}ms` });

		return response;
	}

	// One-time setup upon starting the server
	await serverInit;

	event.locals.uuid = uuidv4();
	event.locals.hasAuth = () => hasAuth(event);
	event.locals.requireAuth = () => requireAuth(event);
	event.locals.hasRoles = (...roles: string[]) => hasRoles(event, ...roles);
	event.locals.requireRoles = (...roles: string[]) => requireRoles(event, ...roles);

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return handleWithLogging();
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
	return handleWithLogging();
};

process.on('sveltekit:shutdown', async (reason: 'SIGINT' | 'SIGTERM' | 'IDLE') => {
	console.warn(`Server will be shutting down for reason "${reason}"...`);
	await serverDispose();
	console.warn('Server disposed, shutting down now...');
});
