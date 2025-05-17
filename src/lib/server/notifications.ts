import type { ArmyNotification } from '$types';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$server/db';
import z from 'zod';

export async function getNotifications(userId: number) {
	const query = `
        SELECT
            an.id,
            an.timestamp,
            an.seen,
            an.type,
            an.recipientId,
            an.triggeringUserId,
            an.commentId,
            a.id as armyId,
            a.name AS armyName,
            u1.username as recipientName,
            u2.username as triggeringUserName
        FROM army_notifications an
        LEFT JOIN armies a ON a.id = an.armyId
        LEFT JOIN users u1 ON u1.id = an.recipientId
        LEFT JOIN users u2 ON u2.id = an.triggeringUserId
        WHERE an.recipientId = ? AND an.armyId IS NOT NULL
        ORDER BY an.timestamp DESC
        LIMIT 250
    `;
	return db.query<ArmyNotification>(query, [userId]);
}

export async function acknowledgeNotifications(req: RequestEvent, notificationIds: number[]) {
	const user = req.locals.requireAuth();

	const { ids } = z.object({ ids: z.array(z.number()) }).parse({ ids: notificationIds });

	const query = `
		SELECT id, recipientId
		FROM army_notifications
		WHERE id IN (?) AND seen IS NULL
	`;
	const unacknowledged = await db.query(query, [ids]);

	if (req.locals.hasRoles('admin')) {
		// Can acknowledge all notifications
	} else {
		if (unacknowledged.some((notif) => notif.recipientId !== user.id)) {
			throw new Error("Cannot acknowledge notifications that aren't yours");
		}
	}

	return db.transaction(async (tx) => {
		const unacknowledgedIds = unacknowledged.map((notif) => notif.id);
		const query = `
            UPDATE army_notifications
            SET seen = NOW()
            WHERE id IN (?)
        `;
		await tx.query(query, [unacknowledgedIds]);
	});
}
