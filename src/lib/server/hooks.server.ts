import { type Handle, redirect } from '@sveltejs/kit';
import { db } from '~/lib/server/db';
import { migration } from '~/lib/server/migration';
import { migrate } from '~/lib/server/migrator';
import { lucia } from "~/lib/server/auth/lucia";
import { CronJob } from 'cron';

const hourlyTask = new CronJob('0 0 * * * *', async function() {
	await lucia.deleteExpiredSessions();
})

const serverInit = (async () => {
	hourlyTask.start();
	await db.connect();
	await migrate(migration, db); // TODO: move into @ninjalib/sql
})();

export const handle: Handle = async ({ event, resolve }) => {
	// One-time setup upon starting the server
	await serverInit;

	event.locals.requireAuth = () => {
		if (!event.locals.user) {
			redirect(302, "/login")
		};
	}

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

process.on('exit', async () => {
	hourlyTask.stop();
	await db.dispose();
});
