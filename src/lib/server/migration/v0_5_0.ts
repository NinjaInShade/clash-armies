import type { MySQL, MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(47, `
        ALTER TABLE users
        ADD COLUMN createdTime TIMESTAMP DEFAULT NOW()
    `);
    runStep(48, `
        CREATE TABLE army_tags (
            armyId INT NOT NULL,
            tag VARCHAR(50) NOT NULL,
            PRIMARY KEY (armyId, tag),
            CONSTRAINT fk_army_tags_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE
        )
    `);
    runStep(49, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
	runStep(50, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
	runStep(51, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
	// Insert vote metric so we can store it's weight and update it on-demand if required
	// NOTE: minAgeHours doesn't have any effect since votes are recorded externally of army_metric_events
	runStep(52, `
		INSERT INTO metrics (name, weight, minAgeHours) VALUES
			('vote', 50, 1)
	`);
	runStep(53, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
	runStep(54, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
	runStep(55, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
	runStep(56, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
    runStep(57, async (db: MySQL) => {
        // NOTE: more queries were in this step previously - historical artifact - see <REPLACE_COMMIT>
        // Add "Dragon Duke" hero
        await db.query(`
            ALTER TABLE town_halls
            ADD COLUMN maxDragonDuke SMALLINT DEFAULT NULL AFTER maxMinionPrince
        `, []);
    });
    runStep(58, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
    runStep(59, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
    runStep(60, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
}
