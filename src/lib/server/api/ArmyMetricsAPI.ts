import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { sign, unsign } from 'cookie-signature';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import z from 'zod';
import type { Server } from '$server/api/Server';
import { helpers } from '$server/db';
import { logger, type Logger } from '$server/logger';
import { KNOWN_BOT_UAS } from '$server/utils';
import { pluralize, HOUR, DAY, PAGE_VIEW_METRIC, COPY_LINK_CLICK_METRIC, OPEN_LINK_CLICK_METRIC } from '$shared/utils';

export type MetricWeights = {
	vote: number;
	pageView: number;
	copyLinkClick: number;
	openLinkClick: number;
};

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

const metricWeightsSchema = z.object({
	vote: z.number(),
	pageView: z.number(),
	copyLinkClick: z.number(),
	openLinkClick: z.number(),
});

export class ArmyMetricsAPI {
	public log: Logger;

	private server: Server;
	private visitorIdSecret: string;
	private metricsMinAgeMsOverride?: number;
	/**
	 * Current metric weight values.
	 *
	 * Populated and cached on server startup.
	 *
	 * Only ever updated via {@link updateMetricWeights} (which is currently only accessible to admins).
	 */
	private _metricWeights?: MetricWeights;

	constructor(server: Server, options: ArmyMetricsAPIOptions = {}) {
		this.server = server;
		this.visitorIdSecret = requireVisitorIdSecret();
		this.log = logger('clash-armies:metrics');

		if (typeof options.metricsMinAgeMs === 'number') {
			this.metricsMinAgeMsOverride = options.metricsMinAgeMs;
		}
	}

	public async init() {
		this._metricWeights = await this.fetchMetricWeights();
	}

	public async dispose() {
		//
	}

	public get metricWeights() {
		if (!this._metricWeights) {
			throw new Error('Missing metric weights?');
		}
		return this._metricWeights;
	}

	/**
	 * Update the metric weights used to rank armies, ensuring the cache is refreshed.
	 */
	public async updateMetricWeights(req: RequestEvent, data: unknown) {
		req.locals.requireRoles('admin');

		const weights = metricWeightsSchema.parse(data);
		const rows = [
			['vote', weights.vote],
			['page-view', weights.pageView],
			['copy-link-click', weights.copyLinkClick],
			['open-link-click', weights.openLinkClick],
		] as const;

		await this.server.db.transaction().execute(async (tx) => {
			for (const [name, weight] of rows) {
				await tx.updateTable('metrics').where('name', '=', name).set({ weight }).execute();
			}
		});

		this._metricWeights = weights;

		return weights;
	}

	private async fetchMetricWeights(): Promise<MetricWeights> {
		const metrics: Metric[] = await this.server.db.selectFrom('metrics').selectAll().execute();

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

		const deleteResult = await this.server.db
			.deleteFrom('army_metric_events')
			.where('lastSeen', '<', helpers.ago(`${maxAgeHours + 1} HOUR`))
			.executeTakeFirst();
		const deletedRows = Number(deleteResult.numDeletedRows);

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
			await this.server.db.transaction().execute(async (tx) => {
				await tx
					.updateTable('army_metrics')
					.where('id', '=', metricId)
					.set((eb) => ({ value: eb('value', '+', 1) }))
					.execute();

				const metricEvent = { visitorUUID, armyMetricId: metricId, lastSeen: now };
				await helpers.upsert(tx, 'army_metric_events', metricEvent);
			});
		} else {
			// Event is repeat or spam, ignore
		}
	}

	private async getArmyMetricId(armyId: number, metricName: string) {
		const army = await this.server.db.selectFrom('armies').where('id', '=', armyId).select('id').executeTakeFirst();
		if (!army) {
			throw new Error('Invalid army id');
		}
		const armyMetric: ArmyMetric | undefined = await this.server.db
			.selectFrom('army_metrics')
			.where('armyId', '=', armyId)
			.where('name', '=', metricName)
			.selectAll()
			.executeTakeFirst();

		if (armyMetric) {
			return armyMetric.id;
		} else {
			const insertResult = await this.server.db.insertInto('army_metrics').values({ armyId, name: metricName }).executeTakeFirst();
			return Number(insertResult.insertId);
		}
	}

	private async getArmyMetricEvent(visitorUUID: string, armyMetricId: number) {
		const metricEvent: ArmyMetricEvent | undefined = await this.server.db
			.selectFrom('army_metric_events')
			.where('visitorUUID', '=', visitorUUID)
			.where('armyMetricId', '=', armyMetricId)
			.selectAll()
			.executeTakeFirst();
		return metricEvent;
	}

	/**
	 * Given all available metric types, return the maximum minAgeHours.
	 */
	private async getMetricTypesMaxAge() {
		const { maxAgeHours } = await this.server.db
			.selectFrom('metrics')
			.select((eb) => eb.fn.max('minAgeHours').as('maxAgeHours'))
			.executeTakeFirstOrThrow();
		return maxAgeHours;
	}

	private async requireMetric(name: string) {
		const metric: Metric | undefined = await this.server.db.selectFrom('metrics').where('name', '=', name).selectAll().executeTakeFirst();
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
