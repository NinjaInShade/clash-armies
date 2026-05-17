import type { MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(61, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
    runStep(62, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
    runStep(63, async () => { /* Historical artifact - see <REPLACE_COMMIT> */ });
}
