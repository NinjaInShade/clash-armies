import type { MySQL, MigrationFn } from '@ninjalib/sql';
import EquipmentLevelSeedData from './equipment-levels.json';

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
    runStep(25, async (db: MySQL) => {
        const equipment = await db.getRows('equipment');
        for (const eq of equipment) {
            const levels = EquipmentLevelSeedData[eq.name].map(lvl => ({ ...lvl, equipmentId: eq.id }));
            await db.insertMany('equipment_levels', levels);
        }
    });
}
