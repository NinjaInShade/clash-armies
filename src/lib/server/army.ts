import type { SaveArmy, Army, TownHall, Unit, Equipment, Pet, UnitType, Comment, SaveComment } from '$types';
import { db } from '$server/db';
import { USER_MAX_ARMIES, mergeAdjacentEmptyTags } from '$shared/utils';
import { validateArmy, numberSchema, commentSchema } from '$shared/validation';
import z from 'zod';
import type { RequestEvent } from '@sveltejs/kit';
import type { Request } from '~/app';
import { generateJSON, generateHTML } from '@tiptap/html';
import { getExtensions } from '$shared/guideEditor';
import { parseHTML } from 'zeed-dom';

type GetArmiesParams = {
	req: Request;
	/** Returns the army with this ID */
	id?: number | number[];
	/** Returns the armies for the user with this username */
	username?: string;
};

type GetUnitsParams = {
	type?: UnitType;
};

export async function getArmies(opts: GetArmiesParams) {
	const { req, id, username } = opts;
	const userId = req.user?.id ?? null;

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
					'objectId', un.objectId,
					'housingSpace', un.housingSpace,
					'trainingTime', un.trainingTime,
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
					'name', p.name
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
	`;

	if (Array.isArray(id) && id.length > 0) {
		query += `
			WHERE a.id IN (?)
		`;
		args.push(id);
	} else if (!Array.isArray(id) && id) {
		query += `
			WHERE a.id = ?
		`;
		args.push(id);
	}

	if (username) {
		query += `
			WHERE u.username = ?
		`;
		args.push(username);
	}

	query += `
        GROUP BY a.id
    `;

	const armies = await db.query<Army>(query, args);

	for (const army of armies) {
		// Parse JSON units
		// @ts-expect-error data is a JSON string when it's queried from the database
		army.units = JSON.parse(army.units);
		// @ts-expect-error data is a JSON string when it's queried from the database
		army.equipment = JSON.parse(army.equipment) ?? [];
		// @ts-expect-error data is a JSON string when it's queried from the database
		army.pets = JSON.parse(army.pets) ?? [];
		if (army.guide) {
			// @ts-expect-error data is a JSON string when it's queried from the database
			army.guide = JSON.parse(army.guide);
		}
		// @ts-expect-error data is a JSON string when it's queried from the database
		army.comments = JSON.parse(army.comments) ?? [];
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

type GetSavedArmiesParams = {
	req: Request;
	/** Will return all saved armies for the user with this username */
	username: string;
};

export async function getSavedArmies(opts: GetSavedArmiesParams) {
	const { req, username } = opts;
	const savedArmyIds = (
		await db.query(
			`
		SELECT sa.armyId
		FROM saved_armies sa
		LEFT JOIN users u ON u.username = ?
		WHERE sa.userId = u.id
	`,
			[username]
		)
	).map((row) => row.armyId);
	if (!savedArmyIds.length) {
		return [];
	}
	return getArmies({ req, id: savedArmyIds });
}

export async function getArmy(req: Request, id: number) {
	z.object({ id: z.number() }).parse({ id });
	const armies = await getArmies({ req, id });
	if (!armies.length) {
		return null;
	}
	return armies[0];
}

export async function getTownHalls() {
	return db.query<TownHall>(
		`
		SELECT *, level AS id
		FROM town_halls
	`,
		[]
	);
}

export async function getUnits(opts: GetUnitsParams = {}) {
	const { type } = opts;

	const args: (string | number)[] = [];
	let query = `
		SELECT
			u.id,
			u.type,
			u.name,
			u.objectId,
			u.housingSpace,
			u.trainingTime,
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

	const units = await db.query<Unit>(query, args);

	for (const unit of units) {
		// Parse JSON levels
		// @ts-expect-error data is a JSON string when it's queried from the database
		unit.levels = JSON.parse(unit.levels);
	}

	return units;
}

export async function getEquipment() {
	const query = `
		SELECT
			eq.id,
			eq.hero,
			eq.name,
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
	`;
	const equipment = await db.query<Equipment>(query, []);

	for (const eq of equipment) {
		// Parse JSON levels
		// @ts-expect-error data is a JSON string when it's queried from the database
		eq.levels = JSON.parse(eq.levels);
	}

	return equipment;
}

export async function getPets() {
	const pets = await db.query<Pet>(
		`
		SELECT
			p.id,
			p.name,
			JSON_ARRAYAGG(JSON_OBJECT(
				'id', pl.id,
				'petId', pl.petId,
				'level', pl.level,
				'petHouseLevel', pl.petHouseLevel
			)) AS levels
		FROM pets p
		LEFT JOIN pet_levels pl ON pl.petId = p.id
		GROUP BY p.id
	`,
		[]
	);

	for (const pet of pets) {
		// Parse JSON levels
		// @ts-expect-error data is a JSON string when it's queried from the database
		pet.levels = JSON.parse(pet.levels);
	}

	return pets;
}

export async function saveArmy(event: RequestEvent, data: SaveArmy): Promise<number> {
	const user = event.locals.requireAuth();
	const ctx = {
		units: await getUnits(),
		townHalls: await getTownHalls(),
		equipment: await getEquipment(),
		pets: await getPets(),
	};

	if (data.guide && typeof data.guide.textContent === 'string') {
		// Escapes/sanitizes the HTML for security reasons (converting to JSON and back to HTML achieves this)
		const extensions = getExtensions();
		const sanitized = generateHTML(generateJSON(data.guide.textContent, extensions), extensions);

		// Merge empty lines (empty tags) into one
		const doc = parseHTML(sanitized);
		const merged = mergeAdjacentEmptyTags(doc).trim();

		data.guide.textContent = merged;
	}

	const army = validateArmy(data, ctx);
	const { units, equipment, pets, guide } = army;

	if (!data.id) {
		// Creating army
		const userArmies = await db.getRows('armies', { createdBy: user.id });
		if (userArmies.length === USER_MAX_ARMIES) {
			throw new Error(`Maximum armies reached (${USER_MAX_ARMIES}/${USER_MAX_ARMIES})`);
		}
		return db.transaction(async (tx) => {
			const armyId = await tx.insertOne('armies', {
				name: army.name,
				townHall: army.townHall,
				banner: army.banner,
				createdBy: user.id,
			});
			const armyUnits = units.map((unit) => {
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
			if (army.equipment.length) {
				// TODO: fix this (insertMany should cope/bail if array is empty)
				await tx.insertMany('army_equipment', armyEquipment);
			}
			if (army.pets.length) {
				// TODO: fix this (insertMany should cope/bail if array is empty)
				await tx.insertMany('army_pets', armyPets);
			}
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
	const armyId = numberSchema.parse(army.id);
	const existing = await db.getRow<Army, null>('armies', { id: armyId });
	if (!existing) {
		throw new Error("This army doesn't exist");
	}
	if (user.id === existing.createdBy) {
		// allow user to edit his own army
	} else {
		// otherwise must be an admin to edit someone elses army
		event.locals.requireRoles('admin');
	}
	await db.transaction(async (tx) => {
		// Update army
		const updateQuery = `
				UPDATE armies SET
					name = ?,
					townHall = ?,
					banner = ?
				WHERE id = ?
		`;
		await tx.query(updateQuery, [army.name, army.townHall, army.banner, armyId]);
		// Remove deleted units
		await tx.query('DELETE FROM army_units WHERE armyId = ? AND id NOT IN (?)', [armyId, units.map((u) => u.id ?? null)]);
		// Upsert units
		const unitsData = units.map((u) => ({ id: u.id ?? null, armyId, home: u.home, unitId: u.unitId, amount: u.amount }));
		await tx.upsert('army_units', unitsData);
		if (equipment.length) {
			// Remove deleted equipment
			await tx.query('DELETE FROM army_equipment WHERE armyId = ? AND id NOT IN (?)', [armyId, equipment.map((eq) => eq.id ?? null)]);
			// Upsert equipment
			const equipmentData = equipment.map((eq) => ({ id: eq.id ?? null, armyId, equipmentId: eq.equipmentId }));
			await tx.upsert('army_equipment', equipmentData);
		} else {
			await tx.delete('army_equipment', { armyId });
		}
		if (pets.length) {
			// Remove deleted pets
			await tx.query('DELETE FROM army_pets WHERE armyId = ? AND id NOT IN (?)', [armyId, pets.map((p) => p.id ?? null)]);
			// Upsert pets
			const petsData = pets.map((p) => ({ id: p.id ?? null, armyId, petId: p.petId, hero: p.hero }));
			await tx.upsert('army_pets', petsData);
		} else {
			await tx.delete('army_pets', { armyId });
		}
		if (guide) {
			const guideData = [{ id: guide.id ?? null, armyId, textContent: guide.textContent, youtubeUrl: guide.youtubeUrl }];
			await tx.upsert('army_guides', guideData);
		} else {
			await tx.delete('army_guides', { armyId });
		}
	});
	return armyId;
}

export async function deleteArmy(event: RequestEvent, armyId: number) {
	const { id } = z.object({ id: z.number() }).parse({ id: armyId });
	const user = event.locals.requireAuth();
	const existing = await db.getRow<Army, null>('armies', { id });
	if (!existing) {
		throw new Error("This army doesn't exist");
	}
	if (user.id === existing.createdBy) {
		// allow user to delete his own army
	} else {
		// otherwise must be an admin to delete someone elses army
		event.locals.requireRoles('admin');
	}
	await db.query('DELETE FROM armies WHERE id = ?', [id]);
}

type SaveVoteParams = {
	armyId: number;
	vote: number | null;
};

export async function saveVote(event: RequestEvent, data: SaveVoteParams) {
	const user = event.locals.requireAuth();
	const { armyId, vote } = z
		.object({
			armyId: z.number(),
			vote: z.number(),
		})
		.parse(data);
	if (![-1, 0, 1].includes(vote)) {
		throw new Error('Invalid vote');
	}
	const army = await getArmy(event.locals, armyId);
	if (!army) {
		throw new Error('Could not find army');
	}
	if (vote === 0) {
		await db.query('DELETE FROM army_votes WHERE votedBy = ?', [user.id]);
	} else {
		await db.upsert('army_votes', [{ armyId, votedBy: user.id, vote }]);
	}
}

export async function saveComment(event: RequestEvent, data: SaveComment) {
	const user = event.locals.requireAuth();
	const comment = commentSchema.parse(data);
	const army = await getArmy(event.locals, comment.armyId);

	if (!army) {
		throw new Error('Invalid army');
	}

	if (!comment.id) {
		// Creating new comment
		return db.transaction(async (tx) => {
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
				const parentComment = await tx.getRow<Comment, null>('army_comments', { id: comment.replyTo });
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
	const existing = await db.getRow<Comment, null>('army_comments', { id: commentId });
	if (!existing) {
		throw new Error("This comment doesn't exist");
	}
	if (user.id === existing.createdBy) {
		// allow user to delete his own comment
	} else {
		// otherwise must be an admin to delete someone elses comment
		event.locals.requireRoles('admin');
	}
	if (existing.armyId !== comment.armyId || existing.replyTo !== comment.replyTo) {
		throw new Error('Moving comments is not allowed');
	}
	await db.transaction(async (tx) => {
		const query = `
			UPDATE army_comments SET
				comment = ?
			WHERE id = ?
		`;
		await tx.query(query, [comment.comment, commentId]);
	});
	return commentId;
}

export async function deleteComment(event: RequestEvent, commentId: number) {
	const { id } = z.object({ id: z.number() }).parse({ id: commentId });
	const user = event.locals.requireAuth();
	const existing = await db.getRow<Comment, null>('army_comments', { id });
	if (!existing) {
		throw new Error("This comment doesn't exist");
	}
	if (user.id === existing.createdBy) {
		// allow user to delete his own comment
	} else {
		// otherwise must be an admin to delete someone elses comment
		event.locals.requireRoles('admin');
	}
	await db.delete('army_comments', { id });
}

export async function bookmarkArmy(event: RequestEvent, data: { armyId: number }) {
	const user = event.locals.requireAuth();
	const { armyId } = z.object({ armyId: z.number() }).parse(data);
	const army = await getArmy(event.locals, armyId);
	if (!army) {
		throw new Error('Could not find army');
	}
	await db.insertOne('saved_armies', { armyId, userId: user.id });
}

export async function removeBookmark(event: RequestEvent, data: { armyId: number }) {
	const user = event.locals.requireAuth();
	const { armyId } = z.object({ armyId: z.number() }).parse(data);
	await db.query('DELETE FROM saved_armies WHERE armyId = ? AND userId = ?', [armyId, user.id]);
}
