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
    runStep(43, `
        CREATE TABLE metrics (
            name VARCHAR(100) NOT NULL PRIMARY KEY,
            -- How much weight this metric holds in a ranking algorithm
            weight INT NOT NULL DEFAULT 1,
            -- Minimum hours between the last event (per visitor) of this metric before it can be accepted
            minAgeHours INT NOT NULL
        )
    `);
    runStep(44, `
        INSERT INTO metrics (name, weight, minAgeHours) VALUES
            ('page-view', 1, 12),
            ('copy-link-click', 5, 1),
            ('open-link-click', 5, 1)
    `);
    runStep(45, `
        -- Opens up ability to rank armies with real metrics
        -- As of now it's hard because we really just have votes but most people won't login/vote (there's inherently a lot of friction to get to that stage)
        -- This tries to fix that issue by tracking other metrics that can influence an armies ranking score
        CREATE TABLE army_metrics (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            armyId INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            value INT UNSIGNED NOT NULL DEFAULT 0,
            CONSTRAINT fk_army_metrics_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_metrics_metric_name FOREIGN KEY (name) REFERENCES metrics (name) ON UPDATE CASCADE,
            CONSTRAINT unique_army_metrics_army_id_type UNIQUE (armyId, name)
        )
    `);
    runStep(46, `
        -- This logs the last time a visitor triggered an army metric
        -- This way we can "rate-limit" (as much as possible) certain events (e.g. page views, where you don't want every refresh to count as a new view)
        -- NOTE: armyMetricId may not exist yet, so code will need to ensure if it doesn't exist yet, to insert an entry first.
        CREATE TABLE army_metric_events (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            visitorUUID UUID NOT NULL,
            armyMetricId INT NOT NULL,
            lastSeen TIMESTAMP DEFAULT NOW(),
            CONSTRAINT fk_army_metric_events_army_metric_id FOREIGN KEY (armyMetricId) REFERENCES army_metrics (id) ON DELETE CASCADE,
            CONSTRAINT unique_army_metric_events_visitor_metric UNIQUE (visitorUUID, armyMetricId)
        )
    `);
}
