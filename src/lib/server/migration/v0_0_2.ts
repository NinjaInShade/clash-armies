import type { MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(12, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
}
