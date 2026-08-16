import type { Server } from '$server/api/Server';
import { logger, type Logger } from '$server/logger';
import { HOUR } from '$shared/utils';

/**
 * How long a generated and cached sitemap is served before the next request rebuilds it.
 *
 * Armies are added continuously but crawlers re-fetch a sitemap far less
 * often than that, so there's no value in being more current than this.
 */
export const SITEMAP_TTL = 6 * HOUR;

/**
 * How long browsers/clients may reuse the sitemap response.
 *
 * Deliberately shorter than `SITEMAP_TTL` - the two caches "stack", so
 * matching them would let a crawler see a sitemap up to twice the TTL old.
 *
 * This value is fairly arbitrary, but should be a good amount less than {@link SITEMAP_TTL}.
 */
export const SITEMAP_MAX_AGE_SECONDS = HOUR / 1000;

/**
 * The sitemap protocol caps a single file at 50,000 URLs (and 50MB uncompressed).
 *
 * Going over means splitting into multiple sitemaps behind a sitemap index.
 *
 * Read more about the sitemap protocol: https://www.sitemaps.org/protocol.html
 */
const MAX_URLS = 50_000;

type SitemapURL = {
	/** Path relative to the origin, e.g. "/armies/popular" */
	path: string;
	/**
	 * Relative importance within this site, from 0.0 to 1.0.
	 *
	 * NOTE: Google ignores this entirely, but it's kept because it doesn't
	 * add much cost and other crawlers/tools may still find it relevant.
	 */
	priority: number;
	lastmod?: Date;
};

type SitemapCache = {
	xml: string;
	generatedAt: number;
};

type StaticPage = {
	path: string;
	priority: number;
	/** Whether the page's content tracks the latest army change */
	tracksArmies?: boolean;
};

/**
 * Pages that always exist, independent of game data or user content.
 *
 * Some pages are deliberately excluded.
 * - pages such as `/admin`, `/login`, `/armies/edit/*` are private or add no search value
 * - various pages are excluded (e.g. `/create`) since they are deprecated and just redirect to new canonical locations
 * - `/roadmap`: placeholder page with no real content yet (TBD what to do with this...)
 */
const STATIC_PAGES: StaticPage[] = [
	{ path: '/', priority: 1, tracksArmies: true },
	{ path: '/armies/popular', priority: 0.9, tracksArmies: true },
	{ path: '/armies', priority: 0.9, tracksArmies: true },
	{ path: '/armies/browse', priority: 0.8 },
	{ path: '/armies/town-halls', priority: 0.8 },
	{ path: '/army-builder', priority: 0.8 },
	{ path: '/changelog', priority: 0.3 },
];

/**
 * Generates and caches `/sitemap.xml`.
 *
 * The sitemap is built from the database and game data rather than being a static file, since
 * majority of (army) pages are dynamic and change every time someone creates or edits an army.
 */
export class SitemapAPI {
	public log: Logger;

	private server: Server;

	private cache: SitemapCache | null = null;
	/**
	 * Shared promise for an in-progress build.
	 *
	 * This is to prevent multiple requests arriving after TTL expiration
	 * and each kicking off separate re-generations of the sitemap.
	 */
	private building: Promise<string> | null = null;

	constructor(server: Server) {
		this.server = server;
		this.log = logger('clash-armies:sitemap');
	}

	public async init() {
		// Warm the cache immediately so the first request doesn't wait.
		// Also has the added benefit of a broken sitemap logging an obvious error immediately on deploy.
		try {
			await this.getSitemap();
		} catch (err) {
			this.log.error('Failed generating sitemap on startup:', err);
		}
	}

	/**
	 * Clears the cached sitemap so the next request rebuilds it.
	 *
	 * Exists mainly for tests, but also in the future something may
	 * want to immediately force an invalidation of the cache.
	 */
	public invalidate() {
		this.cache = null;
	}

	public async getSitemap(): Promise<string> {
		if (this.cache && Date.now() - this.cache.generatedAt < SITEMAP_TTL) {
			return this.cache.xml;
		}
		this.building ??= this.rebuild();
		return this.building;
	}

	private async rebuild(): Promise<string> {
		const stale = this.cache;
		try {
			const xml = await this.build();
			this.cache = { xml, generatedAt: Date.now() };
			return xml;
		} catch (err) {
			if (stale) {
				// Serving a slightly stale sitemap beats serving an error
				this.log.error('Failed regenerating sitemap, serving stale copy:', err);
				return stale.xml;
			}
			throw err;
		} finally {
			this.building = null;
		}
	}

	private async build(): Promise<string> {
		const t0 = performance.now();

		const { urls: armyURLs, lastMod: armiesLastMod } = await this.getArmyURLs();

		const urls: SitemapURL[] = [
			...this.getStaticPageURLs(armiesLastMod),
			...this.getGameDataURLs(armiesLastMod),
			...armyURLs,
			...(await this.getProfileURLs()),
		];

		if (urls.length > MAX_URLS) {
			// TODO: surface this more visibly (e.g. admin page or notification)
			this.log.error(`Sitemap has ${urls.length} URLs, over the ${MAX_URLS} limit - time to split into a sitemap index`);
		}

		const xml = this.render(urls);

		const t1 = performance.now();
		const duration = Math.ceil(t1 - t0);
		this.log.info(`Generated sitemap with ${urls.length} URLs in ${duration}ms`);

		return xml;
	}

	private getStaticPageURLs(armiesLastMod: Date | undefined) {
		return STATIC_PAGES.map(({ path, priority, tracksArmies }) => ({ path, priority, lastmod: tracksArmies ? armiesLastMod : undefined }));
	}

	/**
	 * Army list "index" pages that exist for each town hall, troop, spell, siege machine, hero, pet or equipment.
	 */
	private getGameDataURLs(armiesLastMod: Date | undefined) {
		const gameData = this.server.gameData;
		const urls: SitemapURL[] = [];

		for (const level of gameData.validTownHalls) {
			urls.push({ path: `/armies/town-hall-${level}`, priority: 0.7, lastmod: armiesLastMod });
		}

		const slugPages: [slugs: Map<string, string>, segment: string][] = [
			[gameData.troopSlugs, 'troops'],
			[gameData.spellSlugs, 'spells'],
			[gameData.siegeSlugs, 'sieges'],
			[gameData.heroSlugs, 'heroes'],
			[gameData.petSlugs, 'pets'],
			[gameData.equipmentSlugs, 'equipment'],
		];
		for (const [slugs, segment] of slugPages) {
			for (const slug of slugs.keys()) {
				urls.push({ path: `/armies/${segment}/${slug}`, priority: 0.6, lastmod: armiesLastMod });
			}
		}

		return urls;
	}

	/**
	 * Army pages - includes the most recent modification time for use by other page entries.
	 */
	private async getArmyURLs() {
		// Deliberately not `getArmies` - that queries the full army data (units, guides, comments,
		// metrics, etc...) for every row, where all a sitemap needs is the id and when it last changed.
		const armies = await this.server.db.selectFrom('armies').select(['id', 'updatedTime']).orderBy('id').execute();

		// Any army change can reorder or repopulate the army list pages, so they share the most
		// recent army update as their `lastmod` rather than each running their own aggregate query.
		let lastMod: Date | undefined;
		for (const army of armies) {
			if (army.updatedTime && (!lastMod || army.updatedTime > lastMod)) {
				lastMod = army.updatedTime;
			}
		}

		const urls = armies.map((army) => ({ path: `/armies/${army.id}`, priority: 0.5, lastmod: army.updatedTime ?? undefined }));

		return { urls, lastMod };
	}

	/**
	 * Profile pages, for users who have created at least one army.
	 *
	 * NOTE: these URLs are keyed on the username, which users can change, and nothing redirects the
	 * old one - renames will therefore 404 URLs that have already been indexed. TODO: improve this.
	 */
	private async getProfileURLs() {
		const profiles = await this.server.db
			.selectFrom('users as u')
			.innerJoin('armies as a', 'a.createdBy', 'u.id')
			.groupBy('u.id')
			.select((eb) => ['u.username', eb.fn.max('a.updatedTime').as('lastmod')])
			.orderBy('u.id')
			.execute();

		return profiles.map((profile) => {
			return {
				path: `/users/${encodeURIComponent(profile.username)}`,
				priority: 0.4,
				lastmod: profile.lastmod ?? undefined,
			};
		});
	}

	private render(urls: SitemapURL[]): string {
		const origin = 'https://clasharmies.com';

		const entries = urls.map((url) => {
			const tags = [`\t\t<loc>${escapeXML(`${origin}${url.path}`)}</loc>`];
			if (url.lastmod) {
				tags.push(`\t\t<lastmod>${url.lastmod.toISOString()}</lastmod>`);
			}
			tags.push(`\t\t<priority>${url.priority.toFixed(1)}</priority>`);
			return `\t<url>\n${tags.join('\n')}\n\t</url>`;
		});

		return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
	}
}

function escapeXML(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
