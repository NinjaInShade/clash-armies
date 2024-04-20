import type { Handle } from '@sveltejs/kit';
import { db } from '~/lib/server/db';
import { migration } from '~/lib/server/migration';
import { migrate } from '~/lib/server/migrator';

const serverInit = (async () => {
	await db.connect();
	await migrate(migration, db); // TODO: move into @ninjalib/sql
})();

export const handle: Handle = async ({ event, resolve }) => {
	await serverInit;
	event.locals.db = db;
	return resolve(event);
};

process.on('exit', async () => {
	await db.dispose();
});
