import type { MySQL, MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(41, `
        ALTER TABLE army_comments
        MODIFY comment TEXT DEFAULT NULL
    `);
    runStep(42, async (db: MySQL) => {
        // Fix unique units/equipment/pets being duped within armies.
        // This was a bug originally identified by removing an existing unit and then re-adding it (meaning id became undefined).
        // The upsert thus didn't detect the id PK conflict and so didn't "update" it, but instead added a dupe.

        // So we will now add UNIQUE constraints which include the unit/eq/pet IDs which means upsert's will always work correctly.
        // Before we do this, so the UNIQUE migrations don't fail, we will delete all bugged data.

        await db.query(`
            DELETE FROM army_units
            WHERE id NOT IN (
                SELECT min_id FROM (
                    SELECT MIN(id) as min_id
                    FROM army_units
                    GROUP BY armyId, unitId, home
                ) as sub
            );
        `);
        await db.query(`
            DELETE FROM army_equipment
            WHERE id NOT IN (
                SELECT min_id FROM (
                    SELECT MIN(id) as min_id
                    FROM army_equipment
                    GROUP BY armyId, equipmentId
                ) as sub
            );
        `);
        await db.query(`
            DELETE FROM army_pets
            WHERE id NOT IN (
                SELECT min_id FROM (
                    SELECT MIN(id) as min_id
                    FROM army_pets
                    GROUP BY armyId, petId, hero
                ) as sub
            );
        `);

        await db.query(`
            ALTER TABLE army_units
            ADD CONSTRAINT unique_army_units_unit_id UNIQUE (armyId, unitId, home)
        `);
        await db.query(`
            ALTER TABLE army_equipment
            ADD CONSTRAINT unique_army_equipment_equipment_id UNIQUE (armyId, equipmentId)
        `);
        await db.query(`
            ALTER TABLE army_pets
            ADD CONSTRAINT unique_army_pets_pet_id UNIQUE (armyId, petId, hero)
        `);
    });
}
