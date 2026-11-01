import type { MigrationFn } from '#server/migration/migrator.ts';

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    // Heroes an army can bring per town hall (the hero hall's slots).
    // Set by the game data sync.
    runStep(74, `
        ALTER TABLE town_halls
        ADD COLUMN heroSlots TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER ccSiegeCapacity
    `);
}
