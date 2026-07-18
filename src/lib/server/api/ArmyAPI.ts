import type { Server } from '$server/api/Server';
import { ArmyMetricsAPI } from '$server/api/ArmyMetricsAPI';
import { helpers } from '$server/db';
import type { RequestEvent } from '@sveltejs/kit';
import { USER_MAX_ARMIES } from '$shared/utils';
import { validateArmy, numberSchema, commentSchema } from '$shared/validation';
import { generateJSON, generateHTML } from '@tiptap/html';
import { getExtensions } from '$shared/guideEditor';
import { parseHTML } from 'zeed-dom';
import { GuideModel } from '$models/Guide.svelte';
import type { Army, ArmyComment } from '$models';
import { sql } from 'kysely';

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
	 * Only fetch armies containing this unit (by name).
	 * A unit can be a troop, spell or a siege machine.
	 * NOTE: units in the army's clan castle are *not* considered a match.
	 */
	unit?: string;
	/** Only fetch armies featuring this hero (by name, based on existence of hero's equipment or pets) */
	hero?: string;
	/** Only fetch armies with this equipment (by name) */
	equipment?: string;
	/** Only fetch armies with this pet (by name) */
	pet?: string;
};

type GetSavedArmiesOptions = {
	/** Returns the armies saved by this username */
	username: string;
};

type SaveVoteOptions = {
	/** The army to save the vote on */
	armyId: number;
	/** Wherever an upvote (1), downvote (-1), or neutral (0) */
	vote: number;
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

	public async getArmies(req: RequestEvent, options: GetArmiesOptions = {}) {
		const { ids, username, sort, townHall, hero, equipment, pet, unit } = options;
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

		if (equipment) {
			const eqId = this.gameData.equipmentNames.get(equipment);
			if (!eqId) {
				throw new Error(`Unknown equipment: "${equipment}"`);
			}
			query = query.where('a.id', 'in', (eb) => eb.selectFrom('army_equipment as ae2').where('ae2.equipmentId', '=', eqId).select('ae2.armyId'));
		}

		if (pet) {
			const petId = this.gameData.petNames.get(pet);
			if (!petId) {
				throw new Error(`Unknown pet: "${pet}"`);
			}
			query = query.where('a.id', 'in', (eb) => eb.selectFrom('army_pets as ap2').where('ap2.petId', '=', petId).select('ap2.armyId'));
		}

		if (unit) {
			const unitId = this.gameData.troopNames.get(unit) ?? this.gameData.spellNames.get(unit) ?? this.gameData.siegeNames.get(unit);
			if (!unitId) {
				throw new Error(`Unknown unit: "${unit}"`);
			}
			query = query.where('a.id', 'in', (eb) =>
				eb.selectFrom('army_units as au2').where('au2.unitId', '=', unitId).where('au2.home', '=', 'armyCamp').select('au2.armyId')
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
				sql<Army['guide']>`IF(ag.id, JSON_OBJECT(
					'id', ag.id,
					'textContent', ag.textContent,
					'youtubeUrl', ag.youtubeUrl
				), NULL)`.as('guide'),
				sql<boolean>`(sa.id IS NOT NULL)`.as('userBookmarked'),
				eb.fn.coalesce('uv.vote', sql.lit(0)).as('userVote'),
			])
			.execute();

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
		}

		return armies;
	}

	public async getSavedArmies(req: RequestEvent, options: GetSavedArmiesOptions) {
		const { username } = options;

		const savedArmyIds = await this.server.db
			.selectFrom('saved_armies as sa')
			.leftJoin('users as u', (join) => join.on('u.username', '=', username))
			.whereRef('sa.userId', '=', 'u.id')
			.select('sa.armyId')
			.execute();
		const savedArmyIdsArr = savedArmyIds.map((row) => row.armyId);

		if (!savedArmyIdsArr.length) {
			return [];
		}
		return this.getArmies(req, { ids: savedArmyIdsArr });
	}

	public async getArmy(req: RequestEvent, id: number) {
		const armies = await this.getArmies(req, { ids: [id] });
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
