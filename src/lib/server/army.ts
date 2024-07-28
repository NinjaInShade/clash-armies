import type { Army, TownHall, Unit, Equipment, Pet, UnitType, BlackSmithLevel } from '~/lib/shared/types';
import { db } from '~/lib/server/db';
import { BANNERS, USER_MAX_ARMIES, VALID_HEROES, validateArmy } from '~/lib/shared/utils';
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
	req: Request,
	/** Will return all saved armies for the user with this username */
	username: string;
}

export async function getSavedArmies(opts: GetSavedArmiesParams) {
	const { req, username } = opts;
	const savedArmyIds = (await db.query(`
		SELECT sa.armyId
		FROM saved_armies sa
		LEFT JOIN users u ON u.username = ?
		WHERE sa.userId = u.id
	`, [username])).map(row => row.armyId);
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
	const blacksmithLevels = await db.query<BlackSmithLevel>(`
		SELECT *
		FROM blacksmith_levels
		ORDER BY level ASC
	`);
	const equipment = await db.query<Equipment>(
		`
		SELECT
			eq.id,
			eq.hero,
			eq.name,
			eq.epic
		FROM equipment eq
		GROUP BY eq.id
	`,
		[]
	);

	// These equipment have a slightly different case than explained below as they don't require the blacksmith building to unlocked at all to use at all level 1
	const unlockedByDefault = ['Barbarian Puppet', 'Rage Vial', 'Archer Puppet', 'Invisibility Vial', 'Eternal Tome', 'Life Gem', 'Royal Gem', 'Seeking Shield'];

	for (const eq of equipment) {
		// Attach equipment levels (these are determined by the blacksmith levels exclusively, unlike
		// units where each unit could have a different level at the same building level as another)
		eq.levels = new Array(eq.epic ? 27 : 18)
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

const unitSchemaCreating = z.object({
	id: z.number().positive().optional(),
	home: z.enum(['armyCamp', 'clanCastle']),
	unitId: z.number().positive(),
	amount: z.number().positive()
});
const unitSchemaSaving = unitSchemaCreating.extend({
	id: z.number().positive(),
});

const equipmentSchemaCreating = z.object({
	id: z.number().positive().optional(),
	equipmentId: z.number().positive()
});
const equipmentSchemaSaving = equipmentSchemaCreating.extend({
	id: z.number().positive()
});

const petSchemaCreating = z.object({
	id: z.number().positive().optional(),
	hero: z.enum(VALID_HEROES),
	petId: z.number().positive()
});
const petSchemaSaving = petSchemaCreating.extend({
	id: z.number().positive()
});

const armySchemaCreating = z.object({
	id: z.number().positive().optional(),
	name: z.string().min(2).max(25),
	townHall: z.number().positive(),
	banner: z.enum(BANNERS),
	units: z.array(unitSchemaCreating).min(1),
	// Max 2 equipment per hero (further validation in `validateArmy`)
	// TODO: move schema into own file, try to do as much as validation in one place as possible
	// The current issue is that the `validateArmy` validation requires context which wasn't straight
	// forward when I initially coded this, but may be worth taking a closer look at now
	equipment: z
		.array(equipmentSchemaCreating)
		.max(VALID_HEROES.length * 2)
		.optional(),
	// Max 1 pet per hero (further validation in `validateArmy`)
	pets: z.array(petSchemaCreating).max(VALID_HEROES.length).optional()
});
const armySchemaSaving = armySchemaCreating.extend({
	id: z.number().positive(),
	units: z.array(unitSchemaSaving).min(1),
	equipment: z
		.array(equipmentSchemaSaving)
		.max(VALID_HEROES.length * 2)
		.optional(),
	pets: z.array(petSchemaSaving).max(VALID_HEROES.length).optional()
});

export async function saveArmy(event: RequestEvent, data: Partial<Army>) {
	const user = event.locals.requireAuth();
	const ctx = {
		units: await getUnits(),
		townHalls: await getTownHalls(),
		equipment: await getEquipment(),
		pets: await getPets()
	};

	// TODO: fix this (ArmyUnit, ArmyEquipment etc... should either have extra data attached at *all* times or not at all
	// since it can be derived (more performant but possibly a lot of places need data attached so might be a bit of a pain))
	function attachExtraData(army: z.infer<typeof armySchemaCreating>) {
		return {
			...army,
			units: army.units.map((u) => {
				const found = ctx.units.find((u2) => u2.id === u.unitId);
				if (!found) {
					throw new Error('Invalid troop');
				}
				return { ...u, ...found };
			}),
			equipment: (army.equipment ?? []).map((eq) => {
				const found = ctx.equipment.find((eq2) => eq2.id === eq.equipmentId);
				if (!found) {
					throw new Error('Invalid equipment');
				}
				return { ...eq, ...found };
			}),
			pets: (army.pets ?? []).map((p) => {
				const found = ctx.pets.find((p2) => p2.id === p.petId);
				if (!found) {
					throw new Error('Invalid pet');
				}
				return { ...p, ...found };
			}),
		};
	}

	if (!data.id) {
		// Creating army
		const userArmies = await db.getRows('armies', { createdBy: user.id });
		if (userArmies.length === USER_MAX_ARMIES) {
			throw new Error(`Maximum armies reached (${USER_MAX_ARMIES}/${USER_MAX_ARMIES})`);
		}
		const army = armySchemaCreating.parse(data);
		const armyExtra = attachExtraData(army);
		validateArmy(armyExtra, ctx);
		return db.transaction(async (tx) => {
			const armyId = await tx.insertOne('armies', {
				name: army.name,
				townHall: army.townHall,
				banner: army.banner,
				createdBy: user.id
			});
			await tx.insertMany(
				'army_units',
				army.units.map((unit) => {
					return {
						armyId,
						home: unit.home,
						unitId: unit.unitId,
						amount: unit.amount
					};
				})
			);
			if (army.equipment?.length) {
				await tx.insertMany(
					'army_equipment',
					army.equipment.map((eq) => {
						return {
							armyId,
							equipmentId: eq.equipmentId,
						};
					})
				);
			}
			if (army.pets?.length) {
				await tx.insertMany(
					'army_pets',
					army.pets.map((p) => {
						return {
							armyId,
							hero: p.hero,
							petId: p.petId,
						};
					})
				);
			}
			return armyId;
		});
	} else {
		// Updating existing army
		const army = armySchemaSaving.parse(data);
		const armyExtra = attachExtraData(army);
		validateArmy(armyExtra, ctx);
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
		return db.transaction(async (tx) => {
			// Update army
			await tx.query(
				`
				UPDATE armies SET
					name = ?,
					townHall = ?,
					banner = ?
				WHERE id = ?
			`,
				[army.name, army.townHall, army.banner, army.id]
			);

			// Remove deleted units
			await tx.query('DELETE FROM army_units WHERE armyId = ? AND id NOT IN (?)', [army.id, army.units.map((u) => u.id)]);
			// Upsert units
			const unitsData = army.units.map((u) => ({ ...u, armyId: army.id, id: u.id }));
			await tx.upsert('army_units', unitsData);

			if (army.equipment?.length) {
				// Remove deleted equipment
				await tx.query('DELETE FROM army_equipment WHERE armyId = ? AND id NOT IN (?)', [army.id, army.equipment.map((eq) => eq.id)]);
				// Upsert equipment
				const equipmentData = army.equipment.map((eq) => ({ ...eq, armyId: army.id, id: eq.id }));
				await tx.upsert('army_equipment', equipmentData);
			} else {
				// Remove equipment in case this army had any before
				await tx.query('DELETE FROM army_equipment WHERE armyId = ?', [army.id]);
			}

			if (army.pets?.length) {
				// Remove deleted pets
				await tx.query('DELETE FROM army_pets WHERE armyId = ? AND id NOT IN (?)', [army.id, army.pets.map((p) => p.id)]);
				// Upsert pets
				const petsData = army.pets.map((p) => ({ ...p, armyId: army.id, id: p.id }));
				await tx.upsert('army_pets', petsData);
			} else {
				// Remove pets in case this army had any before
				await tx.query('DELETE FROM army_pets WHERE armyId = ?', [army.id]);
			}

			return army.id;
		});
	}
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
			vote: z.number()
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
