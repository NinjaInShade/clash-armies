import type { MySQL } from '@ninjalib/sql';
import util from '@ninjalib/util';
import { migration } from '$server/migration';
import { ArmyAPI } from '$server/api/ArmyAPI';
import { UserAPI } from '$server/api/UserAPI';
import { NotificationAPI } from '$server/api/NotificationAPI';
import { lucia } from '$server/auth/lucia';
import { pluralize } from '$shared/utils';
import { CronJob } from 'cron';

/**
 * General place to keep business logic operations/tasks.
 * Currently doesn't handle any of the request cycle, but up for consideration (could help with testing).
 */
export class Server {
	public db: MySQL;
	public log: util.Logger;

	public army: ArmyAPI;
	public user: UserAPI;
	public notification: NotificationAPI;

	private hourlyTaskJob: CronJob;

	constructor(db: MySQL) {
		this.db = db;
		this.log = util.logger('clash-armies:server');

		this.army = new ArmyAPI(this);
		this.user = new UserAPI(this);
		this.notification = new NotificationAPI(this);

		this.hourlyTaskJob = new CronJob('0 0 * * * *', async () => {
			return this.hourlyTask();
		});
	}

	public async init() {
		await this.db.connect();
		await this.db.migrate(migration);

		this.hourlyTaskJob.start();
		this.hourlyTaskJob.fireOnTick();

		await this.army.init();
		await this.user.init();
		await this.notification.init();
	}

	public async dispose(reason?: string) {
		const start = Date.now();
		this.log.info('Disposing server');

		await this.notification.dispose();
		await this.user.dispose();
		await this.army.dispose();

		this.hourlyTaskJob.stop();
		await this.db.dispose();

		const duration = Date.now() - start;
		this.log.info(`Server disposed in ${duration}ms ${reason ? `[${reason}]` : ''}`);
	}

	private async hourlyTask() {
		const start = Date.now();
		this.log.info('Running hourly task...');

		await this.purgeExpiredSessions();
		await this.purgeOldNotifications();
		await this.army.metrics.purgeOldEvents();

		const duration = Date.now() - start;
		this.log.info(`Finished hourly task in ${duration}ms`);
	}

	private async purgeExpiredSessions() {
		const start = Date.now();
		this.log.info('Deleting expired sessions...');

		await lucia.deleteExpiredSessions();

		const duration = Date.now() - start;
		this.log.info(`Deleted expired sessions in ${duration}ms`);
	}

	private async purgeOldNotifications() {
		const start = Date.now();
		this.log.info('Deleting old notifications...');

		const deletedRows = (await this.db.query('DELETE FROM army_notifications WHERE timestamp < NOW() - INTERVAL 3 MONTH'))?.affectedRows ?? '<unknown>';

		const duration = Date.now() - start;
		const pluralized = pluralize('notification', deletedRows);
		this.log.info(`Deleted ${deletedRows} old ${pluralized} in ${duration}ms`);
	}
}
