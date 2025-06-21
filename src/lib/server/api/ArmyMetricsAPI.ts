import util from '@ninjalib/util';
import type { Server } from '$server/api/Server';
import type { RequestEvent } from '@sveltejs/kit';
import type { MySQL } from '@ninjalib/sql';
import { pluralize, HOUR, DAY, PAGE_VIEW_METRIC, COPY_LINK_CLICK_METRIC, OPEN_LINK_CLICK_METRIC } from '$shared/utils';
import { KNOWN_BOT_UAS } from '$server/utils';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { sign, unsign } from 'cookie-signature';

type Metric = {
	name: string;
	weight: number;
	minAgeHours: number;
};
type ArmyMetric = {
	id: number;
	armyId: number;
	name: string;
	value: number;
};
type ArmyMetricEvent = {
	id: number;
	visitorUUID: string;
	armyMetricId: number;
	lastSeen: Date;
};

type ArmyMetricsAPIOptions = {
	/**
	 * Force the minimum time before metric acceptance to be this.
	 * NOTE: this should only be used for testing purposes.
	 * NOTE: old event purging still uses the db minAgeHours, so this option does not extend to that functionality.
	 */
	metricsMinAgeMs?: number;
};

const VISITOR_COOKIE_NAME = 'visitor_id';

export class ArmyMetricsAPI {
	public log: util.Logger;

	private server: Server;
	private visitorIdSecret: string;
	private metricsMinAgeMsOverride?: number;

	constructor(server: Server, options: ArmyMetricsAPIOptions = {}) {
		this.server = server;
		this.visitorIdSecret = requireVisitorIdSecret();
		this.log = util.logger('clash-armies:metrics');

		if (typeof options.metricsMinAgeMs === 'number') {
			this.metricsMinAgeMsOverride = options.metricsMinAgeMs;
		}
	}

	public async getMetricWeights() {
		const metrics = await this.server.db.getRows<Metric>('metrics');

		const requireMetric = (name: string) => {
			const metric = metrics.find((metric) => metric.name === name);
			if (!metric) {
				throw new Error(`Invalid metric "${name}"`);
			}
			return metric.weight;
		};

		return {
			vote: requireMetric('vote'),
			pageView: requireMetric('page-view'),
			copyLinkClick: requireMetric('copy-link-click'),
			openLinkClick: requireMetric('open-link-click'),
		};
	}

	public async reportPageView(req: RequestEvent, armyId: number) {
		await this.handleMetricEvent(req, armyId, PAGE_VIEW_METRIC);
	}

	public async reportCopyLinkClick(req: RequestEvent, armyId: number) {
		await this.handleMetricEvent(req, armyId, COPY_LINK_CLICK_METRIC);
	}

	public async reportOpenLinkClick(req: RequestEvent, armyId: number) {
		await this.handleMetricEvent(req, armyId, OPEN_LINK_CLICK_METRIC);
	}

	public async requestMiddleware(req: RequestEvent) {
		// Only set cookies for GET/OPTIONS.
		// Just another best-effort guard against bots/malicious requests.
		const method = req.request.method;
		if (method !== 'GET' && method !== 'OPTIONS') {
			return;
		}

		// Don't set if visitor already has a UUID
		if (this.getVisitorId(req)) {
			return;
		}

		const visitorId = uuidv4();
		this.setVisitorId(req, visitorId);
	}

	public async purgeOldEvents() {
		const start = Date.now();
		this.log.info('Deleting old army metric events...');

		// Delete stale rows but ensure you never delete rows that haven't yet reached their
		// "acceptance" age, otherwise you would allow more events to be reported than what's allowed.
		// Example: page view counts once every 12 hours, if we delete events <= 1 hour old, 12x as many page view metrics could be accepted...
		const maxAgeHours = await this.getMetricTypesMaxAge();

		// prettier-ignore
		const queryResult = await this.server.db.query(`
			DELETE FROM army_metric_events
			WHERE lastSeen < NOW() - INTERVAL ${maxAgeHours + 1} HOUR
		`, []);
		const deletedRows = queryResult?.affectedRows ?? '<unknown>';

		const duration = Date.now() - start;
		const pluralized = pluralize('event', deletedRows);
		this.log.info(`Deleted ${deletedRows} old army metric ${pluralized} in ${duration}ms`);
	}

	private async handleMetricEvent(req: RequestEvent, armyId: number, metricName: string) {
		if (!this.shouldReportMetric(req)) {
			this.log.warn('Not reporting metric', { requestId: req.locals.uuid });
			return;
		}

		const visitorUUID = this.validateVisitorId(req);
		if (!visitorUUID) {
			this.deleteVisitorId(req);
			throw new Error('Invalid visitor ID');
		}

		const now = new Date();
		const metric = await this.requireMetric(metricName);
		const minAgeMs = this.metricsMinAgeMsOverride ?? metric.minAgeHours * HOUR;

		const metricId = await this.getArmyMetricId(armyId, metricName);
		const metricEvent = await this.getArmyMetricEvent(visitorUUID, metricId);

		if (!metricEvent || +now - +metricEvent.lastSeen > minAgeMs) {
			await this.server.db.transaction(async (tx) => {
				// prettier-ignore
				await tx.query(`
					UPDATE army_metrics
						SET value = value + 1
					WHERE id = ?
				`, [metricId]);

				await tx.upsert('army_metric_events', [{ visitorUUID, armyMetricId: metricId, lastSeen: now }]);
			});
		} else {
			// Event is repeat or spam, ignore
		}
	}

	private async getArmyMetricId(armyId: number, metricName: string) {
		const army = await this.server.db.query('SELECT id FROM armies WHERE id = ?', [armyId]);
		if (!army.length) {
			throw new Error('Invalid army id');
		}
		const armyMetric = await this.server.db.getRow<ArmyMetric, null>('army_metrics', { armyId, name: metricName });
		if (armyMetric) {
			return armyMetric.id;
		} else {
			return this.server.db.insertOne('army_metrics', { armyId, name: metricName });
		}
	}

	private async getArmyMetricEvent(visitorUUID: string, armyMetricId: number) {
		return this.server.db.getRow<ArmyMetricEvent, null>('army_metric_events', { visitorUUID: visitorUUID, armyMetricId });
	}

	/**
	 * Given all available metric types, return the maximum minAgeHours.
	 */
	private async getMetricTypesMaxAge() {
		const result = await this.server.db.query<{ maxAgeHours: number }>(`
			SELECT MAX(minAgeHours) as maxAgeHours
			FROM metrics
		`);
		return result[0].maxAgeHours;
	}

	private async requireMetric(name: string) {
		const metric = await this.server.db.getRow<Metric, null>('metrics', { name });
		if (!metric) {
			throw new Error(`Invalid metric "${name}"`);
		}
		return metric;
	}

	/**
	 * Gets visitor id cookie value.
	 * NOTE: this just returns the value, but doesn't validate it's been signed by us.
	 */
	private getVisitorId(req: RequestEvent) {
		return req.cookies.get(VISITOR_COOKIE_NAME);
	}

	/**
	 * Return visitor id cookie value, ensuring it's valid for use.
	 * Will return undefined if empty, cannot be verified to have been signed by us, or not in the expected format.
	 */
	private validateVisitorId(req: RequestEvent) {
		const visitorId = this.getVisitorId(req);
		if (!visitorId) {
			return undefined;
		}

		const unsigned = unsign(visitorId, this.visitorIdSecret);
		if (!unsigned) {
			this.log.warn('Invalid visitor cookie signature:', { requestId: req.locals.uuid });
			return undefined;
		}

		if (!isUuid(unsigned)) {
			return undefined;
		}

		return unsigned;
	}

	/**
	 * Sets visitor id cookie.
	 * UUID value is signed with a secret.
	 */
	private setVisitorId(req: RequestEvent, uuid: string) {
		// See https://developer.chrome.com/blog/cookie-max-age-expires/
		const maxAge = (DAY * 400) / 1000;
		const uuidSigned = sign(uuid, this.visitorIdSecret);

		req.cookies.set(VISITOR_COOKIE_NAME, uuidSigned, {
			path: '/',
			sameSite: 'strict',
			maxAge,
		});
	}

	private deleteVisitorId(req: RequestEvent) {
		req.cookies.delete(VISITOR_COOKIE_NAME, { path: '/' });
	}

	private shouldReportMetric(req: RequestEvent) {
		const ua = req.request.headers.get('User-Agent');
		if (!ua) {
			return false;
		}
		const isBotUA = KNOWN_BOT_UAS.some((bot) => ua.includes(bot));
		if (isBotUA) {
			return false;
		}
		return true;
	}
}

function requireVisitorIdSecret() {
	const { VISITOR_ID_SECRET } = env;
	if (!VISITOR_ID_SECRET) {
		throw new Error('Expected visitor id secret to be defined');
	}
	return VISITOR_ID_SECRET;
}
