import { sql } from 'kysely';
import type { Database } from '$server/db';
import { logger } from '$server/logger';

export type MigrationFn = (step: number, query: string | ((db: Database) => Promise<void>)) => void;
export type Migration = (runStep: MigrationFn) => void;

const log = logger('ca:migration');

export async function migrate(migration: Migration, db: Database) {
	const steps: { step: number; query: string | ((db: Database) => Promise<void>) }[] = [];

	function runStep(step: number, query: string | ((db: Database) => Promise<void>)) {
		const expectedStep = (steps[steps.length - 1]?.step ?? 0) + 1;
		if (step !== expectedStep) {
			throw new Error(`Invalid step, expected "${expectedStep}" but got "${step}"`);
		}
		steps.push({ step, query });
	}
	async function getCurrentStep() {
		const dbStep = (await db.selectFrom('__migration__').select('step').executeTakeFirst())?.step;
		if (dbStep === undefined) {
			await db.insertInto('__migration__').values({ step: 0 }).execute();
			return 0;
		}
		if (Number.isNaN(+dbStep)) {
			// Shouldn't happen unless someone messes with the table manually
			throw new Error(`The current migration step is invalid`);
		} else {
			return +dbStep;
		}
	}

	// Run migration file and collect migrations needed to be ran
	migration(runStep);

	// Ensure table exists
	await sql`CREATE TABLE IF NOT EXISTS __migration__ (step INT NOT NULL)`.execute(db);

	// Get current step
	const currentStep = await getCurrentStep();

	// Run migrations (in transaction)
	await db.transaction().execute(async (tx) => {
		for (const migration of steps) {
			if (migration.step <= currentStep) {
				// Already ran
				continue;
			}
			log.info(`Migrating step ${migration.step}...`);
			try {
				if (typeof migration.query === 'function') {
					await migration.query(tx);
				} else {
					await sql.raw(migration.query).execute(db);
				}
				await tx
					.updateTable('__migration__')
					.set((eb) => ({ step: eb('step', '+', 1) }))
					.execute();
				log.info(`Finished migrating step ${migration.step}`);
			} catch (err) {
				throw new Error(`Failed to migrate step "${migration.step}": ${err}`);
			}
		}
	});
}
