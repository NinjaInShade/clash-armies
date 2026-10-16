import { sql } from 'kysely';
import { db, waitForDatabase } from '#server/db.ts';

/**
 * Resets the test database before the test run.
 *
 * The test database container is kept running between runs (see `test:before`) since
 * recreating it means extra overhead running tests, which takes an extra couple of seconds.
 */
export default async function setup() {
	try {
		// Poll quickly since the container may have only just been started
		await waitForDatabase(db, { maxAttempts: 300, delayMs: 100 });

		// Drop tables rather than database since the pool connects to the database, so it must exist
		const tables = await db.introspection.getTables();

		await db.connection().execute(async (conn) => {
			await sql`SET FOREIGN_KEY_CHECKS = 0`.execute(conn);

			for (const table of tables) {
				await conn.schema.dropTable(table.name).execute();
			}

			await sql`SET FOREIGN_KEY_CHECKS = 1`.execute(conn);
		});
	} finally {
		await db.destroy();
	}
}
