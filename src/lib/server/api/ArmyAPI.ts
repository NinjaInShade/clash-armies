import type { Server } from '$server/api/Server';
import { ArmyMetricsAPI } from '$server/api/ArmyMetricsAPI';
import { helpers } from '$server/db';
import type { RequestEvent } from '@sveltejs/kit';
import {
	USER_MAX_ARMIES,
	ARMY_TAGS,
	ARMY_TAGS_BY_CODE,
	MAX_FILTER_SEARCH_LENGTH,
	MAX_FILTER_UNITS,
	MAX_FILTER_EQUIPMENTS,
	MAX_FILTER_PETS,
} from '$shared/utils';
import { validateArmy, numberSchema, commentSchema, parsePageParam, parseField, coerceBoolean, coerceNumber } from '$shared/validation';
import { generateJSON, generateHTML } from '@tiptap/html';
import { getExtensions } from '$shared/guideEditor';
import { parseHTML } from 'zeed-dom';
import { GuideModel } from '$models/Guide.svelte';
import type { Army, ArmyComment } from '$models';
import { sql } from 'kysely';
import z from 'zod';

type GetArmiesOptions = {
	/** Returns the armies with these ID's */
	ids?: number[];
	/** Returns the armies made by this user */
	username?: string;
	/** Sort order */
	sort?: 'new' | 'score';
	/** Only fetch armies for this town hall */
	townHall?: number;
	/**
	 * Only fetch armies containing *all* of these units (by id).
	 * A unit can be a troop, spell or a siege machine.
	 * NOTE: units in the army's clan castle are *not* considered a match.
	 */
	units?: number[];
	/** Only fetch armies featuring this hero (by name, based on existence of hero's equipment or pets) */
	hero?: string;
	/** Only fetch armies containing *all* of these equipments (by id) */
	equipments?: number[];
	/** Only fetch armies containing *all* of these pets (by id) */
	pets?: number[];
	/** Only fetch armies whose name contains this (case-insensitive) */
	search?: string;
	/**
	 * Only fetch armies of this composition, based on the housing space ratio of flying vs ground units
	 * NOTE: the ratio is calculated based on both army camp + clan castle units.
	 */
	attackType?: 'Ground' | 'Air' | 'Hybrid';
	/**
	 * Only fetch armies which have a guide.
	 *
	 * Will function correctly regardless of the `includeGuideContent` option.
	 */
	hasGuide?: true;
	/**
	 * Whether to include each army's full guide content.
	 *
	 * When false, `guide` will always be null - use `hasGuide` instead to check for presence.
	 *
	 * @default false
	 */
	includeGuideContent?: boolean;
	/** Only fetch armies which do *not* contain any super troops */
	noSuperTroops?: true;
	/** Only fetch armies which do *not* contain any epic equipment */
	noEpicEquipment?: true;
	/** Only fetch armies with (true) or without (false) any clan castle units */
	hasClanCastle?: boolean;
	/** Only fetch armies with (true) or without (false) any equipment */
	hasEquipment?: boolean;
	/** Only fetch armies with (true) or without (false) any pets */
	hasPets?: boolean;
	/** Only fetch armies tagged with *all* of these tags */
	tags?: string[];
	/**
	 * 1-indexed page number, used together with `limit` to paginate results.
	 * Ignored if `limit` isn't also set.
	 * Uses simple LIMIT/OFFSET pagination, not cursor-based pagination.
	 */
	page?: number;
	/**
	 * Max number of armies to return.
	 * @default 500
	 */
	limit?: number;
};

type GetSavedArmiesOptions = Pick<GetArmiesOptions, 'page' | 'limit'> & {
	/** Returns the armies saved by this username */
	username: string;
};

type SaveVoteOptions = {
	/** The army to save the vote on */
	armyId: number;
	/** Wherever an upvote (1), downvote (-1), or neutral (0) */
	vote: number;
};

// Each field is it's own zod schema and not one `z.object` so we can parse each field independently.
const armyListQueryFieldSchemas = {
	search: z.string().trim().min(1).max(MAX_FILTER_SEARCH_LENGTH),
	townHall: z.number().int().positive(),
	attackType: z.enum(['Ground', 'Air', 'Hybrid']),
	hasGuide: z.literal(true),
	noSuperTroops: z.literal(true),
	noEpicEquipment: z.literal(true),
	hasClanCastle: z.boolean(),
	hasEquipment: z.boolean(),
	hasPets: z.boolean(),
	units: z.array(z.number().int().positive()).min(1).max(MAX_FILTER_UNITS),
	equipments: z.array(z.number().int().positive()).min(1).max(MAX_FILTER_EQUIPMENTS),
	pets: z.array(z.number().int().positive()).min(1).max(MAX_FILTER_PETS),
	tags: z.array(z.enum(ARMY_TAGS)).min(1).max(ARMY_TAGS.length),
};

export class ArmyAPI {
	public metrics: ArmyMetricsAPI;

	private server: Server;

	constructor(server: Server) {
		this.server = server;

		this.metrics = new ArmyMetricsAPI(this.server);
	}

	public async init() {
		//
	}

	public async dispose() {
		//
	}

	public get gameData() {
		return this.server.gameData;
	}

	/**
	 * Parse and validate army list query from search parameters, to be used by army querying.
	 *
	 * Unknown or malformed values are silently dropped rather than throwing.
	 */
	public parseArmyListQuery(searchParams: URLSearchParams) {
		const unitIds: number[] = [];
		const equipmentIds: number[] = [];
		const petIds: number[] = [];
		const units = searchParams.get('units') ?? '';
		for (const part of units.split('-')) {
			const type = part[0];
			const id = +part.substring(1);
			// Drop malformed parts individually rather than letting one void the whole filter
			if (!Number.isInteger(id) || id < 1) {
				continue;
			}
			if (type === 'u' && unitIds.length < MAX_FILTER_UNITS) {
				unitIds.push(id);
			} else if (type === 'e' && equipmentIds.length < MAX_FILTER_EQUIPMENTS) {
				equipmentIds.push(id);
			} else if (type === 'p' && petIds.length < MAX_FILTER_PETS) {
				petIds.push(id);
			}
		}

		const tagsQuery = searchParams.get('tags') ?? '';
		const tags = tagsQuery
			.split('-')
			.filter(Boolean)
			.map((code) => ARMY_TAGS_BY_CODE[code])
			.filter(Boolean);

		const schema = armyListQueryFieldSchemas;
		return {
			search: parseField(schema.search, searchParams.get('search')),
			townHall: parseField(schema.townHall, coerceNumber(searchParams.get('townHall'))),
			attackType: parseField(schema.attackType, searchParams.get('attackType')),
			hasGuide: parseField(schema.hasGuide, coerceBoolean(searchParams.get('hasGuide'))),
			noSuperTroops: parseField(schema.noSuperTroops, coerceBoolean(searchParams.get('noSuperTroops'))),
			noEpicEquipment: parseField(schema.noEpicEquipment, coerceBoolean(searchParams.get('noEpicEquipment'))),
			hasClanCastle: parseField(schema.hasClanCastle, coerceBoolean(searchParams.get('hasClanCastle'))),
			hasEquipment: parseField(schema.hasEquipment, coerceBoolean(searchParams.get('hasEquipment'))),
			hasPets: parseField(schema.hasPets, coerceBoolean(searchParams.get('hasPets'))),
			units: parseField(schema.units, unitIds),
			equipments: parseField(schema.equipments, equipmentIds),
			pets: parseField(schema.pets, petIds),
			tags: parseField(schema.tags, tags),
			page: parsePageParam(searchParams.get('page')),
		};
	}

	public async getArmies(req: RequestEvent, options: GetArmiesOptions = {}) {
		const {
			ids,
			username,
			townHall,
			hero,
			equipments = [],
			pets = [],
			units = [],
			search,
			attackType,
			hasGuide,
			includeGuideContent = false,
			noSuperTroops,
			noEpicEquipment,
			hasClanCastle,
			hasEquipment,
			hasPets,
			tags = [],
			sort,
			page,
			limit = 500,
		} = options;
		const userId = req.locals.user?.id ?? null;
		const weights = await this.metrics.getMetricWeights();

		let query = this.server.db
			.selectFrom('armies as a')
			.leftJoin(
				(eb) =>
					eb
						.selectFrom('army_units as au')
						.groupBy('au.armyId')
						.select([
							'au.armyId',
							helpers
								.jsonAggObj({
									id: 'au.id',
									home: 'au.home',
									unitId: 'au.unitId',
									amount: 'au.amount',
								})
								.as('units'),
						])
						.as('au'),
				(join) => join.onRef('au.armyId', '=', 'a.id')
			)
			.leftJoin(
				(eb) =>
					eb
						.selectFrom('army_equipment as ae')
						.groupBy('ae.armyId')
						.select([
							'ae.armyId',
							helpers
								.jsonAggObj({
									id: 'ae.id',
									equipmentId: 'ae.equipmentId',
								})
								.as('equipment'),
						])
						.as('ae'),
				(join) => join.onRef('ae.armyId', '=', 'a.id')
			)
			.leftJoin(
				(eb) =>
					eb
						.selectFrom('army_pets as ap')
						.groupBy('ap.armyId')
						.select([
							'ap.armyId',
							helpers
								.jsonAggObj({
									id: 'ap.id',
									hero: 'ap.hero',
									petId: 'ap.petId',
								})
								.as('pets'),
						])
						.as('ap'),
				(join) => join.onRef('ap.armyId', '=', 'a.id')
			)
			.leftJoin(
				(eb) =>
					eb
						.selectFrom('army_comments as ac')
						.leftJoin('users as u', 'u.id', 'ac.createdBy')
						.groupBy('ac.armyId')
						.select([
							'ac.armyId',
							helpers
								.jsonAggObj({
									id: 'ac.id',
									armyId: 'ac.armyId',
									comment: 'ac.comment',
									replyTo: 'ac.replyTo',
									username: 'u.username',
									createdBy: 'ac.createdBy',
									createdTime: 'ac.createdTime',
									updatedTime: 'ac.updatedTime',
								})
								.as('comments'),
						])
						.as('ac'),
				(join) => join.onRef('ac.armyId', '=', 'a.id')
			)
			.leftJoin(
				(eb) =>
					eb
						.selectFrom('army_tags as art')
						.groupBy('art.armyId')
						.select(['art.armyId', helpers.jsonAgg('art.tag').as('tags')])
						.as('art'),
				(join) => join.onRef('art.armyId', '=', 'a.id')
			)
			.leftJoin('army_guides as ag', 'ag.armyId', 'a.id')
			.leftJoin('army_votes as uv', (join) => join.onRef('uv.armyId', '=', 'a.id').on('uv.votedBy', '=', userId))
			.leftJoin('saved_armies as sa', (join) => join.onRef('sa.armyId', '=', 'a.id').on('sa.userId', '=', userId))
			.leftJoin('users as u', 'u.id', 'a.createdBy')
			.leftJoin(
				(eb) =>
					eb
						.selectFrom('army_votes')
						.select((eb) => ['armyId', eb.fn.coalesce(eb.fn.sum('vote'), sql.lit(0)).as('votes')])
						.groupBy('armyId')
						.as('av'),
				(join) => join.onRef('av.armyId', '=', 'a.id')
			)
			.leftJoin('army_metrics as metric_pv', (join) => join.onRef('metric_pv.armyId', '=', 'a.id').on('metric_pv.name', '=', 'page-view'))
			.leftJoin('army_metrics as metric_cl', (join) => join.onRef('metric_cl.armyId', '=', 'a.id').on('metric_cl.name', '=', 'copy-link-click'))
			.leftJoin('army_metrics as metric_ol', (join) => join.onRef('metric_ol.armyId', '=', 'a.id').on('metric_ol.name', '=', 'open-link-click'));

		if (ids && ids.length) {
			query = query.where('a.id', 'in', ids);
		}
		if (username) {
			query = query.where('u.username', '=', username);
		}
		if (townHall) {
			query = query.where('a.townHall', '=', townHall);
		}
		if (search) {
			// Escape LIKE wildcards in the (user-provided) search term.
			// Note this is so that a search term like "50%" matches as the
			// user specified it, not interpreted as "50 followed by anything".
			const escaped = search.replace(/[\\%_]/g, '\\$&');
			query = query.where('a.name', 'like', `%${escaped}%`);
		}
		if (hero) {
			query = query.where((eb) =>
				eb.or([
					eb(
						'a.id',
						'in',
						eb.selectFrom('army_equipment as ae2').innerJoin('equipment as eq2', 'eq2.id', 'ae2.equipmentId').where('eq2.hero', '=', hero).select('ae2.armyId')
					),
					eb('a.id', 'in', eb.selectFrom('army_pets as ap2').where('ap2.hero', '=', hero).select('ap2.armyId')),
				])
			);
		}
		if (equipments.length) {
			const uniqueEquipments = Array.from(new Set(equipments));
			query = query.where((eb) =>
				eb.exists(
					eb
						.selectFrom('army_equipment as ae2')
						.whereRef('ae2.armyId', '=', 'a.id')
						.where('ae2.equipmentId', 'in', uniqueEquipments)
						.having((eb) => eb.fn.count('ae2.equipmentId').distinct(), '=', uniqueEquipments.length)
						.select(sql.lit(1).as('exists'))
				)
			);
		}
		if (pets.length) {
			const uniquePets = Array.from(new Set(pets));
			query = query.where((eb) =>
				eb.exists(
					eb
						.selectFrom('army_pets as ap2')
						.whereRef('ap2.armyId', '=', 'a.id')
						.where('ap2.petId', 'in', uniquePets)
						.having((eb) => eb.fn.count('ap2.petId').distinct(), '=', uniquePets.length)
						.select(sql.lit(1).as('exists'))
				)
			);
		}
		if (units.length) {
			const uniqueUnits = Array.from(new Set(units));
			query = query.where((eb) =>
				eb.exists(
					eb
						.selectFrom('army_units as au2')
						.whereRef('au2.armyId', '=', 'a.id')
						.where('au2.home', '=', 'armyCamp')
						.where('au2.unitId', 'in', uniqueUnits)
						.having((eb) => eb.fn.count('au2.unitId').distinct(), '=', uniqueUnits.length)
						.select(sql.lit(1).as('exists'))
				)
			);
		}
		if (attackType) {
			// Mirrors `ArmyModel.getArmyType` logic for calculating the composition of the army.
			// Consider making this a dedicated column updated on save, as the computation below can be quite inefficient.
			let ratioCondition: ReturnType<typeof sql<boolean>>;
			switch (attackType) {
				case 'Air':
					ratioCondition = sql<boolean>`SUM(CASE WHEN u2.isFlying = 1 THEN au2.amount * u2.housingSpace ELSE 0 END) > 0.6 * SUM(au2.amount * u2.housingSpace)`;
					break;
				case 'Ground':
					ratioCondition = sql<boolean>`SUM(CASE WHEN u2.isFlying = 1 THEN au2.amount * u2.housingSpace ELSE 0 END) < 0.4 * SUM(au2.amount * u2.housingSpace)`;
					break;
				case 'Hybrid':
					ratioCondition = sql<boolean>`SUM(CASE WHEN u2.isFlying = 1 THEN au2.amount * u2.housingSpace ELSE 0 END) BETWEEN 0.4 * SUM(au2.amount * u2.housingSpace) AND 0.6 * SUM(au2.amount * u2.housingSpace)`;
					break;
			}
			query = query.where((eb) =>
				eb.exists(
					eb
						.selectFrom('army_units as au2')
						.innerJoin('units as u2', 'u2.id', 'au2.unitId')
						.whereRef('au2.armyId', '=', 'a.id')
						.where('u2.type', '!=', 'Spell')
						.having(ratioCondition)
						.select(sql.lit(1).as('exists'))
				)
			);
		}
		if (hasGuide) {
			query = query.where('ag.id', 'is not', null);
		}
		if (noSuperTroops) {
			query = query.where((eb) => {
				const hasSuperTroops = eb.exists(
					eb
						.selectFrom('army_units as au2')
						.innerJoin('units as u2', 'u2.id', 'au2.unitId')
						.whereRef('au2.armyId', '=', 'a.id')
						.where('u2.isSuper', '=', 1)
						.select('au2.armyId')
				);
				return eb.not(hasSuperTroops);
			});
		}
		if (noEpicEquipment) {
			query = query.where((eb) => {
				const hasEpicEquipment = eb.exists(
					eb
						.selectFrom('army_equipment as ae2')
						.innerJoin('equipment as eq2', 'eq2.id', 'ae2.equipmentId')
						.whereRef('ae2.armyId', '=', 'a.id')
						.where('eq2.epic', '=', 1)
						.select('ae2.armyId')
				);
				return eb.not(hasEpicEquipment);
			});
		}
		if (hasClanCastle !== undefined) {
			query = query.where((eb) => {
				const hasClanCastleUnits = eb.exists(eb.selectFrom('army_units').whereRef('armyId', '=', 'a.id').where('home', '=', 'clanCastle').select('armyId'));
				return hasClanCastle ? hasClanCastleUnits : eb.not(hasClanCastleUnits);
			});
		}
		if (hasEquipment !== undefined) {
			query = query.where('ae.armyId', hasEquipment ? 'is not' : 'is', null);
		}
		if (hasPets !== undefined) {
			query = query.where('ap.armyId', hasPets ? 'is not' : 'is', null);
		}
		if (tags.length) {
			const uniqueTags = Array.from(new Set(tags));
			query = query.where((eb) =>
				eb.exists(
					eb
						.selectFrom('army_tags')
						.whereRef('armyId', '=', 'a.id')
						.where('tag', 'in', uniqueTags)
						.having((eb) => eb.fn.count('tag').distinct(), '=', uniqueTags.length)
						.select(sql.lit(1).as('exists'))
				)
			);
		}

		if (sort === 'score') {
			// `score` shows a TS error but is a valid column - it's just not yet selected in Kysely's eyes.
			// Putting the `orderBy` after `select` would fix it but you can't simply chain it without losing
			// type safety of your results (it seems possible with weird workarounds, but I'd rather not at this time).
			query = query.orderBy('score', 'desc').orderBy('createdTime', 'desc');
		} else {
			query = query.orderBy('createdTime', 'desc');
		}

		if (limit) {
			query = query.limit(limit).offset(((page ?? 1) - 1) * limit);
		}

		const armies = await query
			.groupBy('a.id')
			.selectAll('a')
			.select((eb) => [
				// TODO: should not have to CAST, needs investigating
				sql<number>`CAST((
					(COALESCE(av.votes, 0) * ${weights.vote}) +
					(COALESCE(metric_pv.value, 0) * ${weights.pageView}) +
					(COALESCE(metric_cl.value, 0) * ${weights.copyLinkClick}) +
					(COALESCE(metric_ol.value, 0) * ${weights.openLinkClick})
				) AS INTEGER)`.as('score'),
				eb.cast(eb.fn.coalesce('av.votes', sql.lit(0)), 'integer').as('votes'),
				eb.cast(eb.fn.coalesce('metric_pv.value', sql.lit(0)), 'integer').as('pageViews'),
				eb.cast(eb.fn.coalesce('metric_ol.value', sql.lit(0)), 'integer').as('openLinkClicks'),
				eb.cast(eb.fn.coalesce('metric_cl.value', sql.lit(0)), 'integer').as('copyLinkClicks'),
				'u.username',
				'au.units',
				'ae.equipment',
				'ap.pets',
				'ac.comments',
				'art.tags',
				sql<boolean>`(ag.id IS NOT NULL)`.as('hasGuide'),
				(includeGuideContent
					? sql<Army['guide']>`IF(ag.id, JSON_OBJECT(
						'id', ag.id,
						'textContent', ag.textContent,
						'youtubeUrl', ag.youtubeUrl
					), NULL)`
					: sql<Army['guide']>`NULL`
				).as('guide'),
				sql<boolean>`(sa.id IS NOT NULL)`.as('userBookmarked'),
				eb.fn.coalesce('uv.vote', sql.lit(0)).as('userVote'),
				// Total rows matching the filters *before* the LIMIT/OFFSET are applied above.
				// Uses window function to prevent running another query, with the trade-off that every row will get a `total` field.
				eb.fn.countAll<number>().over().as('total'),
			])
			.execute();

		let total = armies[0]?.total ?? 0;

		// The window function only produces a total when at least one row comes back, so an offset past
		// the end (stale bookmark, armies since deleted, etc...) would report zero and leave the client
		// with no pagination controls to get back to a valid page.
		if (!armies.length && limit && (page ?? 1) > 1) {
			const counted = await query
				.clearLimit()
				.clearOffset()
				.clearOrderBy()
				.select((eb) => eb.fn.count<number>('a.id').distinct().as('total'))
				.executeTakeFirst();
			total = Number(counted?.total ?? 0);
		}

		for (const army of armies) {
			army.equipment ??= [];
			army.pets ??= [];
			army.tags ??= [];
			army.comments ??= [];

			for (const comment of army.comments) {
				// JSON agg objects lose date type casting
				comment.createdTime = new Date(`${comment.createdTime}Z`);
				comment.updatedTime = new Date(`${comment.updatedTime}Z`);
			}

			// @ts-expect-error data is 0/1 number when it's queried from the database // TODO: I think TINYINT(1) should just be returning a boolean?
			army.userBookmarked = army.userBookmarked === 1;
			// @ts-expect-error data is 0/1 number when it's queried from the database // TODO: I think TINYINT(1) should just be returning a boolean?
			army.hasGuide = army.hasGuide === 1;
		}

		return { armies, total };
	}

	public async getSavedArmies(req: RequestEvent, options: GetSavedArmiesOptions) {
		const { username, page, limit } = options;

		const savedArmyIds = await this.server.db
			.selectFrom('saved_armies as sa')
			.leftJoin('users as u', (join) => join.on('u.username', '=', username))
			.whereRef('sa.userId', '=', 'u.id')
			.select('sa.armyId')
			.execute();
		const savedArmyIdsArr = savedArmyIds.map((row) => row.armyId);

		if (!savedArmyIdsArr.length) {
			return { armies: [], total: 0 };
		}
		return this.getArmies(req, { ids: savedArmyIdsArr, page, limit });
	}

	public async getArmy(req: RequestEvent, id: number, options: Pick<GetArmiesOptions, 'includeGuideContent'> = {}) {
		const { armies } = await this.getArmies(req, { ids: [id], includeGuideContent: options.includeGuideContent });
		if (!armies.length) {
			return null;
		}
		return armies[0];
	}

	/**
	 * Save an army, returning it's new or existing id
	 */
	public async saveArmy(req: RequestEvent, data: unknown): Promise<number> {
		const user = req.locals.requireAuth();

		const model = validateArmy(data, this.gameData.data);
		const { equipment, pets, guide, allUnits, tags } = model;

		if (guide && typeof guide.textContent === 'string') {
			// Escapes/sanitizes the HTML for security reasons (converting to JSON and back to HTML achieves this)
			const extensions = getExtensions();
			const sanitized = generateHTML(generateJSON(guide.textContent, extensions), extensions);

			// Merge empty lines (empty tags) into one
			const doc = parseHTML(sanitized);
			const merged = GuideModel.mergeAdjacentEmptyTags(doc).trim();

			guide.textContent = merged;
		}

		if (!model.id) {
			// Creating army
			const userArmies = await this.server.db.selectFrom('armies').where('createdBy', '=', user.id).selectAll().execute();
			if (userArmies.length === USER_MAX_ARMIES) {
				throw new Error(`Maximum armies reached (${USER_MAX_ARMIES}/${USER_MAX_ARMIES})`);
			}

			return this.server.db.transaction().execute(async (tx) => {
				const insertResult = await tx
					.insertInto('armies')
					.values({
						name: model.name,
						townHall: model.townHall,
						banner: model.banner,
						createdBy: user.id,
					})
					.executeTakeFirstOrThrow();
				const armyId = Number(insertResult.insertId);

				const armyUnits = allUnits.map((u) => ({ armyId, home: u.home, unitId: u.unitId, amount: u.amount }));
				const armyEquipment = equipment.map((eq) => ({ armyId, equipmentId: eq.equipmentId }));
				const armyPets = pets.map((p) => ({ armyId, petId: p.petId, hero: p.hero }));
				const armyTags = tags.map((tag) => ({ armyId, tag }));

				if (armyUnits.length) {
					await tx.insertInto('army_units').values(armyUnits).execute();
				}
				if (armyEquipment.length) {
					await tx.insertInto('army_equipment').values(armyEquipment).execute();
				}
				if (armyPets.length) {
					await tx.insertInto('army_pets').values(armyPets).execute();
				}
				if (armyTags.length) {
					await tx.insertInto('army_tags').values(armyTags).execute();
				}

				if (guide) {
					await tx
						.insertInto('army_guides')
						.values({
							armyId,
							textContent: guide.textContent,
							youtubeUrl: guide.youtubeUrl,
						})
						.execute();
				}

				return armyId;
			});
		}

		// Updating existing army
		const armyId = numberSchema.parse(model.id);
		const existing = await this.server.db.selectFrom('armies').where('id', '=', armyId).selectAll().executeTakeFirst();
		if (!existing) {
			throw new Error("This army doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to edit his own army
		} else {
			// otherwise must be an admin to edit someone elses army
			req.locals.requireRoles('admin');
		}

		return this.server.db.transaction().execute(async (tx) => {
			const armyUnits = allUnits.map((u) => ({ id: u.id, armyId, home: u.home, unitId: u.unitId, amount: u.amount }));
			const armyEquipment = equipment.map((eq) => ({ id: eq.id, armyId, equipmentId: eq.equipmentId }));
			const armyPets = pets.map((p) => ({ id: p.id, armyId, petId: p.petId, hero: p.hero }));
			const armyTags = tags.map((tag) => ({ armyId, tag }));

			await tx.updateTable('armies').where('id', '=', armyId).set({ name: model.name, townHall: model.townHall, banner: model.banner }).execute();

			await tx.deleteFrom('army_units').where('armyId', '=', armyId).execute();
			if (armyUnits.length) {
				await tx.insertInto('army_units').values(armyUnits).execute();
			}

			await tx.deleteFrom('army_equipment').where('armyId', '=', armyId).execute();
			if (armyEquipment.length) {
				await tx.insertInto('army_equipment').values(armyEquipment).execute();
			}

			await tx.deleteFrom('army_pets').where('armyId', '=', armyId).execute();
			if (armyPets.length) {
				await tx.insertInto('army_pets').values(armyPets).execute();
			}

			await tx.deleteFrom('army_tags').where('armyId', '=', armyId).execute();
			if (armyTags.length) {
				await tx.insertInto('army_tags').values(armyTags).execute();
			}

			if (guide) {
				const guideData = { id: guide.id, armyId, textContent: guide.textContent, youtubeUrl: guide.youtubeUrl };
				await helpers.upsert(tx, 'army_guides', guideData);
			} else {
				await tx.deleteFrom('army_guides').where('armyId', '=', armyId).execute();
			}

			return armyId;
		});
	}

	public async deleteArmy(req: RequestEvent, armyId: number) {
		const user = req.locals.requireAuth();

		const existing = await this.server.db.selectFrom('armies').where('id', '=', armyId).selectAll().executeTakeFirst();
		if (!existing) {
			throw new Error("This army doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to delete his own army
		} else {
			// otherwise must be an admin to delete someone elses army
			req.locals.requireRoles('admin');
		}

		await this.server.db.deleteFrom('armies').where('id', '=', armyId).execute();
	}

	public async saveComment(req: RequestEvent, data: unknown) {
		const user = req.locals.requireAuth();
		const comment = commentSchema.parse(data);

		const army = await this.getArmy(req, comment.armyId);
		if (!army) {
			throw new Error('Invalid army');
		}

		if (!comment.id) {
			// Creating new comment
			return this.server.db.transaction().execute(async (tx) => {
				const insertResult = await tx
					.insertInto('army_comments')
					.values({
						armyId: comment.armyId,
						comment: comment.comment,
						replyTo: comment.replyTo,
						createdBy: user.id,
					})
					.executeTakeFirst();
				const commentId = Number(insertResult.insertId);
				const notification = {
					armyId: army.id,
					triggeringUserId: user.id,
					commentId,
				};
				if (comment.replyTo) {
					const parentComment = await tx.selectFrom('army_comments').where('id', '=', comment.replyTo).selectAll().executeTakeFirst();
					if (!parentComment) {
						throw new Error('Parent comment does not exist');
					}
					if (parentComment.createdBy !== user.id) {
						// Notify the person to which this comment is replying to (but not if replying to yourself)
						await tx
							.insertInto('army_notifications')
							.values({ ...notification, type: 'comment-reply', recipientId: parentComment.createdBy })
							.execute();
					}
					if (parentComment.createdBy !== army.createdBy && user.id !== army.createdBy) {
						// Notify the army creator someone commented if the reply wasn't already to the creator
						await tx
							.insertInto('army_notifications')
							.values({ ...notification, type: 'comment', recipientId: army.createdBy })
							.execute();
					}
				} else {
					if (user.id !== army.createdBy) {
						// Notify the army creator someone commented
						await tx
							.insertInto('army_notifications')
							.values({ ...notification, type: 'comment', recipientId: army.createdBy })
							.execute();
					}
				}
				return commentId;
			});
		}

		const commentId = numberSchema.parse(comment.id);
		const existing = await this.server.db.selectFrom('army_comments').where('id', '=', commentId).selectAll().executeTakeFirst();
		if (!existing) {
			throw new Error("This comment doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to delete his own comment
		} else {
			// otherwise must be an admin to delete someone elses comment
			req.locals.requireRoles('admin');
		}

		if (existing.armyId !== comment.armyId || existing.replyTo !== comment.replyTo) {
			throw new Error('Moving comments is not allowed');
		}

		await this.server.db.transaction().execute(async (tx) => {
			await tx.updateTable('army_comments').where('id', '=', commentId).set({ comment: comment.comment }).execute();
		});

		return commentId;
	}

	public async deleteComment(req: RequestEvent, commentId: number) {
		const user = req.locals.requireAuth();

		const existing = await this.server.db.selectFrom('army_comments').where('id', '=', commentId).selectAll().executeTakeFirst();
		if (!existing) {
			throw new Error("This comment doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to delete his own comment
		} else {
			// otherwise must be an admin to delete someone elses comment
			req.locals.requireRoles('admin');
		}

		await this.server.db.deleteFrom('army_comments').where('id', '=', commentId).execute();
	}

	public async bookmark(req: RequestEvent, armyId: number) {
		const user = req.locals.requireAuth();

		const army = await this.getArmy(req, armyId);
		if (!army) {
			throw new Error('Could not find army');
		}

		await this.server.db.insertInto('saved_armies').values({ armyId, userId: user.id }).execute();
	}

	public async removeBookmark(req: RequestEvent, armyId: number) {
		const user = req.locals.requireAuth();
		await this.server.db.deleteFrom('saved_armies').where('armyId', '=', armyId).where('userId', '=', user.id).execute();
	}

	public async saveVote(req: RequestEvent, options: SaveVoteOptions) {
		const user = req.locals.requireAuth();

		const { armyId, vote } = options;

		if (![-1, 0, 1].includes(vote)) {
			throw new Error('Invalid vote');
		}

		const army = await this.getArmy(req, armyId);
		if (!army) {
			throw new Error('Could not find army');
		}

		if (vote === 0) {
			await this.server.db.deleteFrom('army_votes').where('votedBy', '=', user.id).execute();
		} else {
			await helpers.upsert(this.server.db, 'army_votes', { armyId, votedBy: user.id, vote });
		}
	}
}
