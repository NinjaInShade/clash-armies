import type { RequestEvent } from '@sveltejs/kit';
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import { UnitModel } from '$models/Unit.svelte';
import { Server } from '$server/api/Server';
import { db } from '$server/db';
import type { StaticGameData } from '$types';
import { assert, createReq, createUsers, makeData, USER, USER_2 } from '../testutil';

describe('Sitemap', function () {
	let server: Server;
	let gameData: StaticGameData;
	let req: RequestEvent;

	let armyId: number;
	let armyId2: number;

	/** All `<loc>` values in the given sitemap */
	function locs(xml: string) {
		return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1]);
	}

	/** All `<loc>` values with the origin stripped */
	function paths(xml: string) {
		return locs(xml).map((loc) => new URL(loc).pathname);
	}

	beforeAll(async function () {
		server = new Server(db);
		await server.init();
		gameData = server.gameData.data;

		await createUsers(server);
		req = createReq(USER, server);

		await server.db.deleteFrom('armies').execute();

		const data = makeData({
			name: 'sitemap test',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		const data2 = makeData({
			name: 'sitemap test 2',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		armyId = await server.army.saveArmy(req, data);
		armyId2 = await server.army.saveArmy(req, data2);

		// The cache was warmed during `init`, before these armies existed
		server.sitemap.invalidate();
	});

	afterAll(async function () {
		await server.db.deleteFrom('army_units').execute();
		await server.db.deleteFrom('armies').execute();
		await server.dispose();
	});

	it('Should be a well formed urlset of absolute URLs', async function () {
		const xml = await server.sitemap.getSitemap();

		assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">\n/);
		assert.match(xml, /<\/urlset>\n$/);

		const urls = locs(xml);
		assert.isNotEmpty(urls);
		for (const url of urls) {
			assert.match(url, /^https?:\/\/[^/]+\//);
		}

		// Duplicate URLs are a wasted crawl at best, and a conflicting signal at worst
		assert.sameMembers(urls, Array.from(new Set(urls)));
	});

	it('Should include the main pages', async function () {
		const xml = await server.sitemap.getSitemap();
		const sitemapPaths = paths(xml);

		for (const path of ['/', '/armies', '/armies/popular', '/armies/browse', '/armies/town-halls', '/army-builder']) {
			assert.include(sitemapPaths, path);
		}
	});

	it('Should include a page per army, with its last updated time', async function () {
		const xml = await server.sitemap.getSitemap();
		const sitemapPaths = paths(xml);

		assert.include(sitemapPaths, `/armies/${armyId}`);
		assert.include(sitemapPaths, `/armies/${armyId2}`);

		const army = await server.db.selectFrom('armies').where('id', '=', armyId).select('updatedTime').executeTakeFirstOrThrow();
		assert.include(xml, `<lastmod>${army.updatedTime?.toISOString()}</lastmod>`);
	});

	it('Should include a page per town hall and unit', async function () {
		const xml = await server.sitemap.getSitemap();
		const sitemapPaths = paths(xml);

		for (const level of server.gameData.validTownHalls) {
			assert.include(sitemapPaths, `/armies/town-hall-${level}`);
		}

		const slugPages = [
			[server.gameData.troopSlugs, 'troops'],
			[server.gameData.spellSlugs, 'spells'],
			[server.gameData.siegeSlugs, 'sieges'],
			[server.gameData.heroSlugs, 'heroes'],
			[server.gameData.petSlugs, 'pets'],
			[server.gameData.equipmentSlugs, 'equipment'],
		] as const;
		for (const [slugs, segment] of slugPages) {
			assert.isNotEmpty(Array.from(slugs.keys()));
			for (const slug of slugs.keys()) {
				assert.include(sitemapPaths, `/armies/${segment}/${slug}`);
			}
		}
	});

	it('Should not include private, auth-gated or redirecting pages', async function () {
		const xml = await server.sitemap.getSitemap();
		const sitemapPaths = paths(xml);

		for (const path of ['/admin', '/login', '/create', '/users', '/roadmap', '/armies/latest']) {
			assert.notInclude(sitemapPaths, path);
		}
		for (const path of sitemapPaths) {
			assert.notMatch(path, /^\/(admin|api)\//);
			assert.notMatch(path, /^\/armies\/edit\//);
		}
	});

	it('Should include a profile page per user that has created armies', async function () {
		const xml = await server.sitemap.getSitemap();
		const sitemapPaths = paths(xml);

		assert.include(sitemapPaths, `/users/${USER.username}`);
		assert.notInclude(sitemapPaths, `/users/${USER_2.username}`);
	});

	it('Should serve the cached sitemap until invalidated', async function () {
		const xml = await server.sitemap.getSitemap();

		const data = makeData({
			name: 'sitemap test 3',
			townHall: 1,
			units: [{ home: 'armyCamp', unitId: UnitModel.requireTroopByName('Barbarian', gameData).id, amount: 5 }],
		});
		const newArmyId = await server.army.saveArmy(req, data);

		assert.equal(await server.sitemap.getSitemap(), xml);
		assert.notInclude(paths(await server.sitemap.getSitemap()), `/armies/${newArmyId}`);

		server.sitemap.invalidate();
		assert.include(paths(await server.sitemap.getSitemap()), `/armies/${newArmyId}`);
	});

	it('Should build once when several requests race a cold cache', async function () {
		server.sitemap.invalidate();

		const build = vi.spyOn(server.sitemap as unknown as { build: () => Promise<string> }, 'build');
		try {
			const results = await Promise.all([server.sitemap.getSitemap(), server.sitemap.getSitemap(), server.sitemap.getSitemap()]);
			assert.lengthOf(build.mock.calls, 1);
			assert.equal(new Set(results).size, 1);
		} finally {
			build.mockRestore();
		}
	});
});
