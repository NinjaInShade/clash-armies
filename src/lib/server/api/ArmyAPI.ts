import type { Server } from '$server/api/Server';
import { parseDBJsonField } from '$server/utils';
import { ArmyMetricsAPI } from '$server/api/ArmyMetricsAPI';
import type { RequestEvent } from '@sveltejs/kit';
import z from 'zod';
import { USER_MAX_ARMIES } from '$shared/utils';
import { validateArmy, numberSchema, commentSchema } from '$shared/validation';
import { generateJSON, generateHTML } from '@tiptap/html';
import { getExtensions } from '$shared/guideEditor';
import { parseHTML } from 'zeed-dom';
import { GuideModel } from '$models/Guide.svelte';
import type { Army, ArmyComment } from '$models';
import type { Unit, Equipment, Pet, TownHall, UnitType, StaticGameData } from '$types';

type GetArmiesOptions = {
	/** Returns the armies with these ID's */
	ids?: number[];
	/** Returns the armies made by this user */
	username?: string;
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

type GetUnitsOptions = {
	type?: UnitType;
};

export class ArmyAPI {
	public metrics: ArmyMetricsAPI;

	/** Game units static data */
	public units: Unit[] = [];
	/** Game equipment static data */
	public equipment: Equipment[] = [];
	/** Game pets static data */
	public pets: Pet[] = [];
	/** Game town halls static data */
	public townHalls: TownHall[] = [];

	private server: Server;

	constructor(server: Server) {
		this.server = server;

		this.metrics = new ArmyMetricsAPI(this.server, { metricsMinAgeMs: 1000 * 60 });
	}

	public async init() {
		this.units = await this.getUnitsData();
		this.equipment = await this.getEquipmentData();
		this.pets = await this.getPetsData();
		this.townHalls = await this.getTownHallsData();
	}

	public async dispose() {
		//
	}

	/**
	 * Static game data cache.
	 * Populated during `Server.init()` via migration-only additions.
	 * This DB data is immutable post-startup and should not be modified at runtime.
	 *
	 * Approximate RAM usage: ~185KB (at time of this commit). But unless big schema
	 * changes happen in theory this shouldn't ever drastically increase.
	 */
	public get gameData(): StaticGameData {
		const { units, equipment, pets, townHalls } = this;
		return { units, equipment, pets, townHalls };
	}

	public async getArmies(req: RequestEvent, options: GetArmiesOptions = {}) {
		const { ids, username } = options;
		const userId = req.locals.user?.id ?? null;

		const args: (number | number[] | string | null)[] = [userId, userId];
		let query = `
			SELECT
				a.*,
				u.username,
				au.units,
				ae.equipment,
				ap.pets,
				ac.comments,
				av.votes,
				IF(ag.id, JSON_OBJECT(
					'id', ag.id,
					'textContent', ag.textContent,
					'youtubeUrl', ag.youtubeUrl
				), NULL) as guide,
				COALESCE(uv.vote, 0) AS userVote,
				sa.id IS NOT NULL AS userBookmarked
			FROM armies a
			LEFT JOIN users u ON u.id = a.createdBy
			LEFT JOIN (
				SELECT
					a.id,
					JSON_ARRAYAGG(JSON_OBJECT(
						'id', au.id,
						'home', au.home,
						'armyId', a.id,
						'unitId', un.id,
						'amount', au.amount,
						'name', un.name,
						'type', un.type,
						'clashId', un.clashId,
						'housingSpace', un.housingSpace,
						'productionBuilding', un.productionBuilding,
						'isSuper', un.isSuper,
						'isFlying', un.isFlying,
						'isJumper', un.isJumper,
						'airTargets', un.airTargets,
						'groundTargets', un.groundTargets
					)) AS units
				FROM armies a
				LEFT JOIN army_units au ON au.armyId = a.id
				LEFT JOIN units un ON un.id = au.unitId
				WHERE au.id IS NOT NULL
				GROUP BY a.id
			) au ON au.id = a.id
			LEFT JOIN (
				SELECT
					a.id,
					JSON_ARRAYAGG(JSON_OBJECT(
						'id', ae.id,
						'armyId', a.id,
						'equipmentId', eq.id,
						'hero', eq.hero,
						'name', eq.name,
						'clashId', eq.clashId,
						'epic', eq.epic
					)) AS equipment
				FROM armies a
				LEFT JOIN army_equipment ae ON ae.armyId = a.id
				LEFT JOIN equipment eq ON eq.id = ae.equipmentId
				WHERE ae.id IS NOT NULL
				GROUP BY a.id
			) ae ON ae.id = a.id
			LEFT JOIN (
				SELECT
					a.id,
					JSON_ARRAYAGG(JSON_OBJECT(
						'id', ap.id,
						'hero', ap.hero,
						'armyId', a.id,
						'petId', p.id,
						'name', p.name,
						'clashId', p.clashId
					)) AS pets
				FROM armies a
				LEFT JOIN army_pets ap ON ap.armyId = a.id
				LEFT JOIN pets p ON p.id = ap.petId
				WHERE ap.id IS NOT NULL
				GROUP BY a.id
			) ap ON ap.id = a.id
			LEFT JOIN (
				SELECT
					a.id,
					JSON_ARRAYAGG(JSON_OBJECT(
						'id', ac.id,
						'armyId', ac.armyId,
						'comment', ac.comment,
						'replyTo', ac.replyTo,
						'username', u.username,
						'createdBy', ac.createdBy,
						'createdTime', ac.createdTime,
						'updatedTime', ac.updatedTime
					)) AS comments
				FROM armies a
				LEFT JOIN army_comments ac ON ac.armyId = a.id
				LEFT JOIN users u ON u.id = ac.createdBy
				WHERE ac.id IS NOT NULL
				GROUP BY a.id
			) ac ON ac.id = a.id
			LEFT JOIN (
				SELECT armyId, COALESCE(SUM(vote), 0) AS votes
				FROM army_votes
				GROUP BY armyId
			) av ON av.armyId = a.id
			LEFT JOIN army_guides ag ON ag.armyId = a.id
			LEFT JOIN army_votes uv ON uv.armyId = a.id AND uv.votedBy = ?
			LEFT JOIN saved_armies sa ON sa.armyId = a.id AND sa.userId = ?
			WHERE TRUE
		`;

		if (ids && ids.length) {
			query += `
				AND a.id IN (?)
			`;
			args.push(ids);
		}

		if (username) {
			query += `
				AND u.username = ?
			`;
			args.push(username);
		}

		query += `
			GROUP BY a.id
			ORDER BY a.createdTime DESC
		`;

		const armies = await this.server.db.query<Army>(query, args);

		for (const army of armies) {
			army.units = parseDBJsonField(army.units);
			army.equipment = parseDBJsonField(army.equipment) ?? [];
			army.pets = parseDBJsonField(army.pets) ?? [];

			if (army.guide) {
				army.guide = parseDBJsonField(army.guide);
			}

			army.comments = parseDBJsonField(army.comments) ?? [];
			for (const comment of army.comments) {
				// JSON agg objects lose date type casting
				comment.createdTime = new Date(`${comment.createdTime}Z`);
				comment.updatedTime = new Date(`${comment.updatedTime}Z`);
			}

			army.votes = +army.votes;
			// @ts-expect-error data is 0/1 number when it's queried from the database // TODO: I think TINYINT(1) should just be returning a boolean?
			army.userBookmarked = army.userBookmarked === 1 ? true : false;
		}

		return armies;
	}

	public async getSavedArmies(req: RequestEvent, options: GetSavedArmiesOptions) {
		const { username } = options;

		// prettier-ignore
		const savedArmyIds = await this.server.db.query<{ armyId: number }>(`
			SELECT sa.armyId
			FROM saved_armies sa
			LEFT JOIN users u ON u.username = ?
			WHERE sa.userId = u.id
		`, [username]);
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

		const model = validateArmy(data, this.gameData);
		const { equipment, pets, guide, units, ccUnits, allUnits } = model;

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
			const userArmies = await this.server.db.getRows('armies', { createdBy: user.id });
			if (userArmies.length === USER_MAX_ARMIES) {
				throw new Error(`Maximum armies reached (${USER_MAX_ARMIES}/${USER_MAX_ARMIES})`);
			}
			return this.server.db.transaction(async (tx) => {
				const armyId = await tx.insertOne('armies', {
					name: model.name,
					townHall: model.townHall,
					banner: model.banner,
					createdBy: user.id,
				});
				const armyUnits = allUnits.map((unit) => {
					return {
						armyId,
						home: unit.home,
						unitId: unit.unitId,
						amount: unit.amount,
					};
				});
				const armyEquipment = equipment.map((eq) => {
					return {
						armyId,
						equipmentId: eq.equipmentId,
					};
				});
				const armyPets = pets.map((p) => {
					return {
						armyId,
						hero: p.hero,
						petId: p.petId,
					};
				});
				await tx.insertMany('army_units', armyUnits);
				await tx.insertMany('army_equipment', armyEquipment);
				await tx.insertMany('army_pets', armyPets);
				if (guide) {
					await tx.insertOne('army_guides', {
						armyId,
						textContent: guide.textContent,
						youtubeUrl: guide.youtubeUrl,
					});
				}
				return armyId;
			});
		}

		// Updating existing army
		const armyId = numberSchema.parse(model.id);
		const existing = await this.server.db.getRow<Army, null>('armies', { id: armyId });
		if (!existing) {
			throw new Error("This army doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to edit his own army
		} else {
			// otherwise must be an admin to edit someone elses army
			req.locals.requireRoles('admin');
		}

		return this.server.db.transaction(async (tx) => {
			// Update army
			const updateQuery = `
					UPDATE armies SET
						name = ?,
						townHall = ?,
						banner = ?
					WHERE id = ?
			`;
			await tx.query(updateQuery, [model.name, model.townHall, model.banner, armyId]);

			// Remove deleted home units
			if (units.length) {
				const unitIds = units.map((u) => u.unitId);
				await tx.query('DELETE FROM army_units WHERE armyId = ? AND unitId NOT IN (?) AND home = ?', [armyId, unitIds, 'armyCamp']);
			}
			// Remove deleted clan castle units
			if (ccUnits.length) {
				const unitIds = ccUnits.map((u) => u.unitId);
				await tx.query('DELETE FROM army_units WHERE armyId = ? AND unitId NOT IN (?) AND home = ?', [armyId, unitIds, 'clanCastle']);
			}
			// Upsert units - UNIQUE(armyId, unitId, home) means if unit was removed+added and id is undefined it will still update correctly
			const unitsData = allUnits.map((u) => ({ id: u.id ?? null, armyId, home: u.home, unitId: u.unitId, amount: u.amount }));
			await tx.upsert('army_units', unitsData);

			// Remove deleted equipment
			if (equipment.length) {
				const equipmentIds = equipment.map((eq) => eq.equipmentId);
				await tx.query('DELETE FROM army_equipment WHERE armyId = ? AND equipmentId NOT IN (?)', [armyId, equipmentIds]);
			}
			// Upsert equipment - UNIQUE(armyId, equipmentId) means if equipment was removed+added and id is undefined it will still update correctly
			const equipmentData = equipment.map((eq) => ({ id: eq.id ?? null, armyId, equipmentId: eq.equipmentId }));
			await tx.upsert('army_equipment', equipmentData);

			// Remove deleted pets
			if (pets.length) {
				const petIds = pets.map((p) => p.petId);
				await tx.query('DELETE FROM army_pets WHERE armyId = ? AND petId NOT IN (?)', [armyId, petIds]);
			}
			// Upsert pets - UNIQUE(armyId, petId, hero) means if pet was removed+added and id is undefined it will still update correctly
			const petsData = pets.map((p) => ({ id: p.id ?? null, armyId, petId: p.petId, hero: p.hero }));
			await tx.upsert('army_pets', petsData);

			if (guide) {
				const guideData = [{ id: guide.id ?? null, armyId, textContent: guide.textContent, youtubeUrl: guide.youtubeUrl }];
				await tx.upsert('army_guides', guideData);
			} else {
				await tx.delete('army_guides', { armyId });
			}

			return armyId;
		});
	}

	public async deleteArmy(req: RequestEvent, armyId: number) {
		const user = req.locals.requireAuth();

		const existing = await this.server.db.getRow<Army, null>('armies', { id: armyId });
		if (!existing) {
			throw new Error("This army doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to delete his own army
		} else {
			// otherwise must be an admin to delete someone elses army
			req.locals.requireRoles('admin');
		}

		await this.server.db.query('DELETE FROM armies WHERE id = ?', [armyId]);
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
			return this.server.db.transaction(async (tx) => {
				const commentId = await tx.insertOne('army_comments', {
					armyId: comment.armyId,
					comment: comment.comment,
					replyTo: comment.replyTo,
					createdBy: user.id,
				});
				const notification = {
					armyId: army.id,
					triggeringUserId: user.id,
					commentId,
				};
				if (comment.replyTo) {
					const parentComment = await tx.getRow<ArmyComment, null>('army_comments', { id: comment.replyTo });
					if (!parentComment) {
						throw new Error('Parent comment does not exist');
					}
					if (parentComment.createdBy !== user.id) {
						// Notify the person to which this comment is replying to (but not if replying to yourself)
						await tx.insertOne('army_notifications', { ...notification, type: 'comment-reply', recipientId: parentComment.createdBy });
					}
					if (parentComment.createdBy !== army.createdBy && user.id !== army.createdBy) {
						// Notify the army creator someone commented if the reply wasn't already to the creator
						await tx.insertOne('army_notifications', { ...notification, type: 'comment', recipientId: army.createdBy });
					}
				} else {
					if (user.id !== army.createdBy) {
						// Notify the army creator someone commented
						await tx.insertOne('army_notifications', { ...notification, type: 'comment', recipientId: army.createdBy });
					}
				}
				return commentId;
			});
		}

		const commentId = numberSchema.parse(comment.id);
		const existing = await this.server.db.getRow<ArmyComment, null>('army_comments', { id: commentId });
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

		return this.server.db.transaction(async (tx) => {
			// prettier-ignore
			await tx.query(`
				UPDATE army_comments SET
					comment = ?
				WHERE id = ?
			`, [comment.comment, commentId]);

			return commentId;
		});
	}

	public async deleteComment(req: RequestEvent, commentId: number) {
		const user = req.locals.requireAuth();

		const existing = await this.server.db.getRow<ArmyComment, null>('army_comments', { id: commentId });
		if (!existing) {
			throw new Error("This comment doesn't exist");
		}

		if (user.id === existing.createdBy) {
			// allow user to delete his own comment
		} else {
			// otherwise must be an admin to delete someone elses comment
			req.locals.requireRoles('admin');
		}

		await this.server.db.delete('army_comments', { id: commentId });
	}

	public async bookmark(req: RequestEvent, armyId: number) {
		const user = req.locals.requireAuth();

		const army = await this.getArmy(req, armyId);
		if (!army) {
			throw new Error('Could not find army');
		}

		await this.server.db.insertOne('saved_armies', { armyId, userId: user.id });
	}

	public async removeBookmark(req: RequestEvent, armyId: number) {
		const user = req.locals.requireAuth();

		await this.server.db.query('DELETE FROM saved_armies WHERE armyId = ? AND userId = ?', [armyId, user.id]);
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
			await this.server.db.query('DELETE FROM army_votes WHERE votedBy = ?', [user.id]);
		} else {
			await this.server.db.upsert('army_votes', [{ armyId, votedBy: user.id, vote }]);
		}
	}

	private async getUnitsData(options: GetUnitsOptions = {}) {
		const { type } = options;

		const args: (string | number)[] = [];
		let query = `
			SELECT
				u.id,
				u.type,
				u.name,
				u.clashId,
				u.housingSpace,
				u.productionBuilding,
				u.isSuper,
				u.isFlying,
				u.isJumper,
				u.airTargets,
				u.groundTargets,
				JSON_ARRAYAGG(JSON_OBJECT(
					'id', ul.id,
					'unitId', ul.unitId,
					'level', ul.level,
					'spellFactoryLevel', ul.spellFactoryLevel,
					'barrackLevel', ul.barrackLevel,
					'laboratoryLevel', ul.laboratoryLevel
				)) AS levels
			FROM units u
			LEFT JOIN unit_levels ul ON ul.unitId = u.id
			WHERE TRUE
		`;

		if (type) {
			query += `
				AND u.type = ?
			`;
			args.push(type);
		}

		query += `
			GROUP BY u.id
		`;

		const units = await await this.server.db.query<Unit>(query, args);

		for (const unit of units) {
			unit.levels = parseDBJsonField(unit.levels);
		}

		return units;
	}

	private async getEquipmentData() {
		// prettier-ignore
		const equipment = await this.server.db.query<Equipment>(`
			SELECT
				eq.id,
				eq.hero,
				eq.name,
				eq.clashId,
				eq.epic,
				JSON_ARRAYAGG(JSON_OBJECT(
					'id', eql.id,
					'equipmentId', eql.equipmentId,
					'level', eql.level,
					'blacksmithLevel', eql.blacksmithLevel
				)) AS levels
			FROM equipment eq
			LEFT JOIN equipment_levels eql ON eql.equipmentId = eq.id
			GROUP BY eq.id
		`, []);

		for (const eq of equipment) {
			eq.levels = parseDBJsonField(eq.levels);
		}

		return equipment;
	}

	private async getPetsData() {
		// prettier-ignore
		const pets = await this.server.db.query<Pet>(`
			SELECT
				p.id,
				p.name,
				p.clashId,
				JSON_ARRAYAGG(JSON_OBJECT(
					'id', pl.id,
					'petId', pl.petId,
					'level', pl.level,
					'petHouseLevel', pl.petHouseLevel
				)) AS levels
			FROM pets p
			LEFT JOIN pet_levels pl ON pl.petId = p.id
			GROUP BY p.id
		`, []);

		for (const pet of pets) {
			pet.levels = parseDBJsonField(pet.levels);
		}

		return pets;
	}

	private async getTownHallsData() {
		return this.server.db.query<TownHall>(
			`
			SELECT *, level AS id
			FROM town_halls
		`,
			[]
		);
	}
}
