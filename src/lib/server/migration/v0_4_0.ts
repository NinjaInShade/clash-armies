import type { MySQL, MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(41, `
        ALTER TABLE army_comments
        MODIFY comment TEXT DEFAULT NULL
    `);
}
