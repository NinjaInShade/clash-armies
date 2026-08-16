import { sql } from 'kysely';
import type { Database } from '$server/db';
import type { MigrationFn } from '$server/migration/migrator';

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    runStep(73, async (db: Database) => {
        // As part of the move away from using lucia as an npm package and moving to
        // their new, secure, recommended API, all sessions need to be invalidated:
        await db.deleteFrom('sessions').execute();
        // The new secure API also changes the schema of sessions slightly as well.
        await sql`
            ALTER TABLE sessions
            DROP COLUMN expiresAt,
            ADD COLUMN secretHash VARCHAR(64) NOT NULL,
            ADD COLUMN lastVerifiedAt TIMESTAMP NOT NULL DEFAULT NOW(),
            ADD COLUMN createdAt TIMESTAMP NOT NULL DEFAULT NOW()
        `.execute(db);
    });
}
