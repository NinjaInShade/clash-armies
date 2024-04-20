import type { MySQL } from "@ninjalib/sql";

export type MigrationFn = (step: number, query: string) => void;
export type Migration = (runStep: MigrationFn) => void;

// TODO: move to @ninjalib/sql
export async function migrate(migration: Migration, db: MySQL) {
    const steps: { step: number, query: string }[] = [];

    function runStep(step: number, query: string) {
        const expectedStep = (steps[steps.length - 1]?.step ?? 0) + 1;
        if (step !== expectedStep) {
            throw new Error(`Invalid step, expected "${expectedStep}" but got "${step}"`);
        }
        steps.push({ step, query });
    }
    async function getCurrentStep() {
        const dbStep = (await db.getRow<{ step: number }>('__migration__'))?.step;
        if (dbStep === undefined) {
            await db.insertOne('__migration__', { step: 0 });
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
    await db.query('CREATE TABLE IF NOT EXISTS __migration__ (step INT NOT NULL)')

    // Get current step
    const currentStep = await getCurrentStep();

    // Run migrations
    for (const migration of steps) {
        if (migration.step <= currentStep) {
            // Already ran
            continue;
        }
        await db.transaction(async () => {
            try {
                await db.query(migration.query);
                await db.query('UPDATE __migration__ SET step = step + 1');
            } catch (err) {
                throw new Error(`Failed to migrate step "${migration.step}": ${err}`);
            }
        })
    }
}
