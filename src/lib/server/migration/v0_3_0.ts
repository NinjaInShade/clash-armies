import { sql } from 'kysely';
import type { Database } from '$server/db';
import type { MigrationFn } from '$server/migration/migrator';

// oxfmt-ignore
export default function migration(runStep: MigrationFn) {
    runStep(29, async () => { /* Historical artifact - see 768be65 */ });
    runStep(30, async () => { /* Historical artifact - see 768be65 */ });
    runStep(31, async () => { /* Historical artifact - see 768be65 */ });
    // NOTE: more queries were in this step previously - historical artifact - see 768be65
    runStep(32, `
        ALTER TABLE town_halls
        ADD COLUMN maxMinionPrince SMALLINT DEFAULT NULL AFTER maxRoyalChampion
    `);
    runStep(33, `
        ALTER TABLE users
        ADD COLUMN googleEmail VARCHAR(255) DEFAULT NULL AFTER googleId
    `);
    runStep(34, `
        CREATE TABLE army_notifications (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            recipientId INT NOT NULL,
            triggeringUserId INT DEFAULT NULL,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
            seen TIMESTAMP DEFAULT NULL,
            armyId INT NOT NULL,
            commentId INT DEFAULT NULL,
            CONSTRAINT fk_army_notifications_army_id FOREIGN KEY (armyId) REFERENCES armies (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_notifications_user_id FOREIGN KEY (recipientId) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_notifications_other_user_id FOREIGN KEY (triggeringUserId) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT fk_army_notifications_comment_id FOREIGN KEY (commentId) REFERENCES army_comments (id) ON DELETE CASCADE
        )
    `);
    runStep(35, async (db: Database) => {
        // Back-insert notifications for already existing comments before army notifications were implemented
        const { rows: comments } = await sql<{
            id: number;
            armyId: number;
            replyTo: number | null;
            createdTime: Date;
            createdBy: number;
            parentCreatedBy: number | null;
            armyCreatedBy: number;
        }>`
    		SELECT
    			ac.id,
    			ac.armyId,
    			ac.replyTo,
    			ac.createdTime,
    			ac.createdBy,
    			pc.createdBy AS parentCreatedBy,
    			ca.createdBy AS armyCreatedBy
    		FROM army_comments ac
    		LEFT JOIN (SELECT id, createdBy FROM army_comments) pc ON pc.id = ac.replyTo
    		LEFT JOIN (SELECT id, createdBy FROM armies) ca ON ca.id = ac.armyId
    	`.execute(db);

        const notifications: Record<string, unknown>[] = [];

        for (const comment of comments) {
            const notification = {
                armyId: comment.armyId,
                triggeringUserId: comment.createdBy,
                commentId: comment.id,
                timestamp: comment.createdTime,
            }
            if (comment.replyTo) {
                if (comment.parentCreatedBy !== comment.createdBy) {
                    // Notify the person to which this comment is replying to (but not if replying to yourself)
                    notifications.push({ ...notification, type: 'comment-reply', recipientId: comment.parentCreatedBy })
                }
                if (comment.parentCreatedBy !== comment.armyCreatedBy && comment.createdBy !== comment.armyCreatedBy) {
                    // Notify the army creator someone commented if the reply wasn't already to the creator
                    notifications.push({ ...notification, type: 'comment', recipientId: comment.armyCreatedBy });
                }
            } else {
                if (comment.createdBy !== comment.armyCreatedBy) {
                    // Notify the army creator someone commented
                    notifications.push({ ...notification, type: 'comment', recipientId: comment.armyCreatedBy })
                }
            }
        }

        if (notifications.length) {
            await db.insertInto('army_notifications').values(notifications).execute();
        }
    });
    runStep(36, `
        ALTER TABLE units
        DROP COLUMN trainingTime
    `);
    runStep(37, async (db: Database) => {
        // NOTE: more queries were in this step previously - historical artifact - see 768be65
        // Standardize "ObjectIds" to be called "clashId".
        await sql`
            ALTER TABLE units
            RENAME COLUMN objectId TO clashId
        `.execute(db);
        await sql`ALTER TABLE pets ADD COLUMN clashId INT UNSIGNED NOT NULL AFTER name`.execute(db);
        await sql`ALTER TABLE equipment ADD COLUMN clashId INT UNSIGNED NOT NULL AFTER name`.execute(db);
    });
    runStep(38, async () => { /* Historical artifact - see 768be65 */ });
    runStep(39, async () => { /* Historical artifact - see 768be65 */ });
    runStep(40, async () => { /* Historical artifact - see 768be65 */ });
}
