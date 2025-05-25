import type { Server } from '$server/api/Server';
import type { RequestEvent } from '@sveltejs/kit';
import { parseDBJsonField } from '$server/utils';
import type { ArmyNotification } from '$types';
import { pluralize } from '$shared/utils';
import util from '@ninjalib/util';
import z from 'zod';

type GetNotificationsOptions = {
	/** Returns notifications for this user */
	userId?: number;
};

export class NotificationAPI {
	private server: Server;
	private log: util.Logger;

	constructor(server: Server) {
		this.server = server;
		this.log = util.logger('clash-armies:notif');
	}

	public async init() {
		//
	}

	public async dispose() {
		//
	}

	public async getNotifications(req: RequestEvent, options: GetNotificationsOptions = {}) {
		const { userId } = options;

		const args: number[] = [];
		let query = `
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
            WHERE TRUE
        `;

		if (userId) {
			query += `
                AND an.recipientId = ? AND an.armyId IS NOT NULL
            `;
			args.push(userId);
		}

		query += `
            ORDER BY an.timestamp DESC
            LIMIT 250
        `;

		return this.server.db.query<ArmyNotification>(query, [userId]);
	}

	public async acknowledge(req: RequestEvent, notificationIds: number[]) {
		const user = req.locals.requireAuth();

		const query = `
            SELECT id, recipientId
            FROM army_notifications
            WHERE id IN (?) AND seen IS NULL
        `;
		const unacknowledged = await this.server.db.query(query, [notificationIds]);

		if (req.locals.hasRoles('admin')) {
			// Can acknowledge all notifications
		} else {
			if (unacknowledged.some((notif) => notif.recipientId !== user.id)) {
				throw new Error("Cannot acknowledge notifications that aren't yours");
			}
		}

		return this.server.db.transaction(async (tx) => {
			const unacknowledgedIds = unacknowledged.map((notif) => notif.id);
			const query = `
                UPDATE army_notifications
                SET seen = NOW()
                WHERE id IN (?)
            `;
			await tx.query(query, [unacknowledgedIds]);
		});
	}

	public async purgeOldNotifications() {
		const start = Date.now();
		this.log.info('Deleting old notifications...');

		const queryResult = await this.server.db.query('DELETE FROM army_notifications WHERE timestamp < NOW() - INTERVAL 1 YEAR');
		const deletedRows = queryResult?.affectedRows ?? '<unknown>';

		const duration = Date.now() - start;
		const pluralized = pluralize('notification', deletedRows);
		this.log.info(`Deleted ${deletedRows} old ${pluralized} in ${duration}ms`);
	}
}
