import type { RequestEvent } from '@sveltejs/kit';
import type { Server } from '$server/api/Server';
import { helpers } from '$server/db';
import { logger, type Logger } from '$server/logger';
import { pluralize } from '$shared/utils';

type GetNotificationsOptions = {
	/** Returns notifications for this user */
	userId?: number;
};

export class NotificationAPI {
	private server: Server;
	private log: Logger;

	constructor(server: Server) {
		this.server = server;
		this.log = logger('clash-armies:notif');
	}

	public async init() {
		//
	}

	public async dispose() {
		//
	}

	public async getNotifications(_req: RequestEvent, options: GetNotificationsOptions = {}) {
		const { userId } = options;

		let query = this.server.db
			.selectFrom('army_notifications as an')
			.leftJoin('armies as a', 'a.id', 'an.armyId')
			.leftJoin('users as u1', 'u1.id', 'an.recipientId')
			.leftJoin('users as u2', 'u2.id', 'an.triggeringUserId');

		if (userId) {
			query = query.where('an.recipientId', '=', userId).where('an.armyId', 'is not', null);
		}

		return query
			.select([
				'an.id',
				'an.timestamp',
				'an.seen',
				'an.type',
				'an.recipientId',
				'an.triggeringUserId',
				'an.commentId',
				'a.id as armyId',
				'a.name as armyName',
				'u1.username as recipientName',
				'u2.username as triggeringUserName',
			])
			.orderBy('an.timestamp', 'desc')
			.limit(250)
			.execute();
	}

	public async acknowledge(req: RequestEvent, notificationIds: number[]) {
		const user = req.locals.requireAuth();

		const unacknowledged = await this.server.db
			.selectFrom('army_notifications')
			.where('id', 'in', notificationIds)
			.where('seen', 'is', null)
			.select(['id', 'recipientId'])
			.execute();

		if (req.locals.hasRoles('admin')) {
			// Can acknowledge all notifications
		} else {
			if (unacknowledged.some((notif) => notif.recipientId !== user.id)) {
				throw new Error("Cannot acknowledge notifications that aren't yours");
			}
		}

		return this.server.db.transaction().execute(async (tx) => {
			const unacknowledgedIds = unacknowledged.map((notif) => notif.id);
			await tx.updateTable('army_notifications').where('id', 'in', unacknowledgedIds).set({ seen: new Date() }).execute();
		});
	}

	public async purgeOldNotifications() {
		const start = Date.now();
		this.log.info('Deleting old notifications...');

		const insertResult = await this.server.db
			.deleteFrom('army_notifications')
			.where('timestamp', '<', () => helpers.ago('1 YEAR'))
			.executeTakeFirst();
		const deletedRows = Number(insertResult.numDeletedRows);

		const duration = Date.now() - start;
		const pluralized = pluralize('notification', deletedRows);
		this.log.info(`Deleted ${deletedRows} old ${pluralized} in ${duration}ms`);
	}
}
