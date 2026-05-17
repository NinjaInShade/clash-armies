import type { MySQL, MigrationFn } from '@ninjalib/sql';

// prettier-ignore
export default function migration(runStep: MigrationFn) {
    runStep(29, async () => { /* Historical artifact - see 768be65 */ });
    runStep(30, async () => { /* Historical artifact - see 768be65 */ });
    runStep(31, async () => { /* Historical artifact - see 768be65 */ });
    runStep(32, async (db: MySQL) => {
        // NOTE: more queries were in this step previously - historical artifact - see 768be65
        await db.query(`
            ALTER TABLE town_halls
            ADD COLUMN maxMinionPrince SMALLINT DEFAULT NULL AFTER maxRoyalChampion
        `, []);
    });
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
    runStep(35, async (db: MySQL) => {
        // Back-insert notifications for already existing comments before army notifications were implemented
        const comments = await db.query(`
            SELECT
                ac.id,
                ac.armyId,
                ac.replyTo,
                ac.createdTime,
                ac.createdBy,
                pc.createdBy as parentCreatedBy,
                ca.createdBy as armyCreatedBy
            FROM army_comments ac
            LEFT JOIN (
                SELECT id, createdBy
                FROM army_comments
            ) pc ON pc.id = ac.replyTo
            LEFT JOIN (
                SELECT id, createdBy
                FROM armies
            ) ca ON ca.id = ac.armyId
        `, []);

        const notifications: any[] = [];

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
            await db.insertMany('army_notifications', notifications)
        }
    });
    runStep(36, `
        ALTER TABLE units
        DROP COLUMN trainingTime
    `);
    runStep(37, async (db: MySQL) => {
        // NOTE: more queries were in this step previously - historical artifact - see 768be65
        // Standardize "ObjectIds" to be called "clashId".
        await db.query(`
            ALTER TABLE units
            RENAME COLUMN objectId TO clashId
        `);
        await db.query('ALTER TABLE pets ADD COLUMN clashId INT UNSIGNED NOT NULL AFTER name');
        await db.query('ALTER TABLE equipment ADD COLUMN clashId INT UNSIGNED NOT NULL AFTER name');
    });
    runStep(38, async () => { /* Historical artifact - see 768be65 */ });
    runStep(39, async () => { /* Historical artifact - see 768be65 */ });
    runStep(40, async () => { /* Historical artifact - see 768be65 */ });
}
