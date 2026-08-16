import type { MigrationFn } from '$server/migration/migrator';

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    runStep(61, async () => { /* Historical artifact - see 768be65 */ });
    runStep(62, async () => { /* Historical artifact - see 768be65 */ });
    runStep(63, async () => { /* Historical artifact - see 768be65 */ });
}
