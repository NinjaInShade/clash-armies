import type { MigrationFn } from '#server/migration/migrator.ts';

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    // Heroes an army can bring per town hall (the hero hall's slots).
    // Set by the game data sync.
    runStep(74, `
        ALTER TABLE town_halls
        ADD COLUMN heroSlots TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER ccSiegeCapacity
    `);
    // TH19 update (squads)
    runStep(75, `
        ALTER TABLE town_halls
        ADD COLUMN maxSquadBarracks SMALLINT DEFAULT NULL AFTER maxPetHouse
    `);
    runStep(76, `
        ALTER TABLE units
        ADD COLUMN isSquad TINYINT(1) NOT NULL DEFAULT 0 AFTER isSuper
    `);
    // Some squads take less housing space as they level up.
    // NULL means the unit's base housing space (or the closest lower level that overrides it).
    runStep(77, `
        ALTER TABLE unit_levels
        ADD COLUMN housingSpace SMALLINT UNSIGNED DEFAULT NULL AFTER laboratoryLevel
    `);
    // Which troops (and how many of each) make up a squad.
    runStep(78, `
        CREATE TABLE unit_squad_members (
            squadId INT NOT NULL,
            unitId INT NOT NULL,
            amount SMALLINT UNSIGNED NOT NULL,
            \`order\` INT NOT NULL DEFAULT 0,
            PRIMARY KEY (squadId, unitId),
            CONSTRAINT fk_unit_squad_members_squad_id FOREIGN KEY (squadId) REFERENCES units (id) ON DELETE CASCADE,
            CONSTRAINT fk_unit_squad_members_unit_id FOREIGN KEY (unitId) REFERENCES units (id)
        )
    `);
}
