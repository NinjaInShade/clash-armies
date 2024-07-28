import type { SaveArmy, Army, TownHall, Unit, Equipment, Pet, UnitType, BlackSmithLevel } from '~/lib/shared/types';
import { db } from '~/lib/server/db';
import { USER_MAX_ARMIES } from '~/lib/shared/utils';
import { validateArmy, numberSchema } from '~/lib/shared/validation';
import z from 'zod';
import type { RequestEvent } from '@sveltejs/kit';
import type { Request } from '~/app';

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
			av.votes,
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
			SELECT armyId, COALESCE(SUM(vote), 0) AS votes
			FROM army_votes
			GROUP BY armyId
		) av ON av.armyId = a.id
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
			eq.epic
		FROM equipment eq
		GROUP BY eq.id
	`;
	const equipment = await db.query<Equipment>(query, []);

	for (const eq of equipment) {
		eq.levels = await getEqLevels(eq);
	}

	return equipment;
}

async function getEqLevels(eq: Equipment) {
	const blacksmithLevels = await db.query<BlackSmithLevel>(`
		SELECT *
		FROM blacksmith_levels
		ORDER BY level ASC
	`);

	// These equipment have a slightly different case than explained below as they don't require the blacksmith building to unlocked at all to use at all level 1
	const unlockedByDefault = ['Barbarian Puppet', 'Rage Vial', 'Archer Puppet', 'Invisibility Vial', 'Eternal Tome', 'Life Gem', 'Royal Gem', 'Seeking Shield'];

	// Attach equipment levels (these are determined by the blacksmith levels exclusively, unlike
	// units where each unit could have a different level at the same building level as another)
	return new Array(eq.epic ? 27 : 18)
		.fill(() => null)
		.map((_, idx) => {
			const level = idx + 1;
			if (unlockedByDefault.includes(eq.name) && level === 1) {
				return { equipmentId: eq.id, level, blacksmithLevel: null };
			}
			const blacksmithLevel = blacksmithLevels.find((bLevel) => (eq.epic ? bLevel.maxEpic : bLevel.maxCommon) >= level)?.level ?? null;
			return { equipmentId: eq.id, level, blacksmithLevel };
		});
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

	const army = validateArmy(data, ctx);
	const { units, equipment, pets } = army;

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
			return armyId;
		});
	}

	// Updating existing army
	const existing = await db.getRow<Army, null>('armies', { id: army.id });
	if (!existing) {
		throw new Error("This army doesn't exist");
	}
	if (user.id === existing.createdBy) {
		// allow user to edit his own army
	} else {
		// otherwise must be an admin to edit someone elses army
		event.locals.requireRoles('admin');
	}
	const armyId = numberSchema.parse(army.id);
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
			await tx.query('DELETE FROM army_equipment WHERE armyId = ?', [armyId]);
		}
		if (pets.length) {
			// Remove deleted pets
			await tx.query('DELETE FROM army_pets WHERE armyId = ? AND id NOT IN (?)', [armyId, pets.map((p) => p.id ?? null)]);
			// Upsert pets
			const petsData = pets.map((p) => ({ id: p.id ?? null, armyId, petId: p.petId, hero: p.hero }));
			await tx.upsert('army_pets', petsData);
		} else {
			await tx.query('DELETE FROM army_pets WHERE armyId = ?', [armyId]);
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
