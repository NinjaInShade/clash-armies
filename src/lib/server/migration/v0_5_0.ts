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
}
