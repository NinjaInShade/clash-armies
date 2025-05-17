import type { Handle, HandleServerError, RequestEvent } from '@sveltejs/kit';
import { db } from '$server/db';
import { migration } from '$server/migration';
import { lucia } from '$server/auth/lucia';
import { getDisplayZodError } from '$server/utils';
import { hasAuth, requireAuth, hasRoles, requireRoles } from '$server/auth/utils';
import { v4 as uuidv4 } from 'uuid';
import { CronJob } from 'cron';
import { dev } from '$app/environment';
import z from 'zod';
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

export function getRequestInfo(req: RequestEvent) {
	const { request, locals } = req;
	const { user, uuid } = locals;
	const { method, url } = request;
	return {
		uuid,
		method,
		url,
		userId: user?.id,
		username: user?.username,
		ip: req.getClientAddress(),
		userAgent: request.headers.get('User-Agent'),
	};
}

function getResponseInfo(request: ReturnType<typeof getRequestInfo>, response: Response) {
	const { uuid, method } = request;
	const { status } = response;
	return { requestId: uuid, method, status };
}

export const handle: Handle = async ({ event: req, resolve }) => {
	async function handleWithLogging() {
		const start = Date.now();
		const requestInfo = getRequestInfo(req);
		log.info('Request:', requestInfo);

		// Runs the request handler
		const response = await resolve(req);

		const requestDuration = Date.now() - start;
		const responseInfo = getResponseInfo(requestInfo, response);
		log.info('Response:', { ...responseInfo, duration: `${requestDuration}ms` });

		return response;
	}

	// One-time setup upon starting the server
	await serverInit;

	req.locals.uuid = uuidv4();
	req.locals.hasAuth = () => hasAuth(req);
	req.locals.requireAuth = () => requireAuth(req);
	req.locals.hasRoles = (...roles: string[]) => hasRoles(req, ...roles);
	req.locals.requireRoles = (...roles: string[]) => requireRoles(req, ...roles);

	const sessionId = req.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		req.locals.user = null;
		req.locals.session = null;
		return handleWithLogging();
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		req.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		req.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes,
		});
	}

	req.locals.user = user;
	req.locals.session = session;
	return handleWithLogging();
};

export const handleError: HandleServerError = async ({ event: req, error, status, message }) => {
	log.error('SvelteKit error:', {
		requestId: req.locals.uuid,
		error,
	});

	// Fallback to default behaviour
	return undefined;
};

process.on('sveltekit:shutdown', async (reason: 'SIGINT' | 'SIGTERM' | 'IDLE') => {
	console.warn(`Server will be shutting down for reason "${reason}"...`);
	await serverDispose();
	console.warn('Server disposed, shutting down now...');
});
