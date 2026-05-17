import type { MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(23, `
        DROP TABLE blacksmith_levels
    `);
    runStep(24, `
        CREATE TABLE equipment_levels (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            equipmentId INT NOT NULL,
            level SMALLINT UNSIGNED NOT NULL,
            blacksmithLevel SMALLINT DEFAULT NULL,
            CONSTRAINT fk_equipment_levels_equipment_id FOREIGN KEY (equipmentId) REFERENCES equipment (id) ON DELETE CASCADE
        )
    `);
    runStep(25, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
}
