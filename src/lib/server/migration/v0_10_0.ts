import type { MySQL, MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(73, async (db: MySQL) => {
        // As part of the move away from using lucia as an npm package and moving to
        // their new, secure, recommended API, all sessions need to be invalidated:
        await db.delete('sessions');
        // The new secure API also changes the schema of sessions slightly as well.
        await db.query(`
            ALTER TABLE sessions
            DROP COLUMN expiresAt,
            ADD COLUMN secretHash VARCHAR(64) NOT NULL,
            ADD COLUMN lastVerifiedAt TIMESTAMP NOT NULL DEFAULT NOW(),
            ADD COLUMN createdAt TIMESTAMP NOT NULL DEFAULT NOW()
        `);
    });
}
