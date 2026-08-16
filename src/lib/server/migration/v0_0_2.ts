import type { MigrationFn } from '$server/migration/migrator';

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    runStep(12, async () => { /* Historical artifact - see 768be65 */ });
}
