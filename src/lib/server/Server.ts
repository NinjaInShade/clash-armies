import type { MySQL } from '@ninjalib/sql';
import util from '@ninjalib/util';
import { migration } from '$server/migration';
import { lucia } from '$server/auth/lucia';
import { CronJob } from 'cron';

/**
 * General place to keep business logic operations/tasks.
 * Currently doesn't handle any of the request cycle, but up for consideration (could help with testing).
 */
export class Server {
	public db: MySQL;
	public log: util.Logger;

	private hourlyTaskJob: CronJob;

	constructor(db: MySQL) {
		this.db = db;
		this.log = util.logger('clash-armies:server');

		this.hourlyTaskJob = new CronJob('0 0 * * * *', async () => {
			return this.hourlyTask();
		});
	}

	public async init() {
		await this.db.connect();
		await this.db.migrate(migration);

		this.hourlyTaskJob.start();
		this.hourlyTaskJob.fireOnTick();
	}

	public async dispose(reason?: string) {
		const start = Date.now();
		this.log.info('Disposing server');

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

		const deletedNotifications =
			(await this.db.query('DELETE FROM army_notifications WHERE timestamp < NOW() - INTERVAL 3 MONTH'))?.affectedRows ?? '<unknown>';

		const duration = Date.now() - start;
		this.log.info(`Deleted ${deletedNotifications} old notification${deletedNotifications !== 1 ? 's' : ''} in ${duration}ms`);
	}
}
