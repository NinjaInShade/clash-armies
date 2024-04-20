import type { Army, TownHall, Unit, UnitType } from '~/lib/shared/types';
import { db } from "~/lib/server/db";
import { BANNERS } from '~/lib/shared/utils';
import z from 'zod';
import type { RequestEvent } from '@sveltejs/kit';

type GetArmiesParams = {
	id?: number;
	username?: string;
};

type GetUnitsParams = {
	type?: UnitType;
}

export async function getArmies(opts: GetArmiesParams = {}) {
	const { id, username } = opts;

	const args: (number | string)[] = [];
	let query = `
        SELECT
			a.*,
			u.username,
            JSON_ARRAYAGG(JSON_OBJECT(
                'id', au.id,
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
            )) AS units,
			th.troopCapacity,
			th.siegeCapacity,
			th.spellCapacity
		FROM armies a
		LEFT JOIN users u ON u.id = a.createdBy
        LEFT JOIN army_units au ON au.armyId = a.id
		LEFT JOIN units un ON un.id = au.unitId
		LEFT JOIN town_halls th ON th.level = a.townHall
    `;

	if (id) {
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
		army.units = JSON.parse(army.units);
	}

	return armies;
}

export async function getArmy(id: number) {
	z.object({ id: z.number() }).parse({ id });
	const armies = await getArmies({ id });
	if (!armies.length) {
		return null;
	}
	return armies[0];
}

export async function getTownHalls() {
	return db.query<TownHall>(`
		SELECT *, level AS id
		FROM town_halls
	`, []);
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
	`

	const units = await db.query<Unit>(query, args);

	for (const unit of units) {
		// Parse JSON levels
		unit.levels = JSON.parse(unit.levels);
	}

	return units;
}

const unitSchemaCreating = z.object({
	id: z.number().positive().optional(),
	unitId: z.number().positive(),
	amount: z.number().positive()
})
const armySchemaCreating = z.object({
	id: z.number().positive().optional(),
	name: z.string().min(2).max(25),
	townHall: z.number().positive(),
	banner: z.enum(BANNERS),
	units: z.array(unitSchemaCreating).min(1)
})

const armySchemaSaving = armySchemaCreating.required({ id: true });

export async function saveArmy(event: RequestEvent, data: Partial<Army>) {
	const user = event.locals.requireAuth();

	if (!data.id) {
		// Creating army
		const army = armySchemaCreating.parse(data);
		return db.transaction(async (tx) => {
			const armyId = await tx.insertOne('armies', {
				name: army.name,
				townHall: army.townHall,
				banner: army.banner,
				createdBy: user.id
			});
			await tx.insertMany('army_units', army.units.map((unit) => {
				return {
					armyId,
					unitId: unit.unitId,
					amount: unit.amount
				}
			}));
			return armyId;
		});
	} else {
		// Updating existing army
		const army = armySchemaSaving.parse(data);
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
			await tx.query(`
				UPDATE armies SET
					name = ?,
					townHall = ?,
					banner = ?
				WHERE id = ?
			`, [army.name, army.townHall, army.banner, army.id])

			// Remove deleted units
			await tx.query('DELETE FROM army_units WHERE armyId = ? AND unitId NOT IN (?)', [army.id, army.units.map(u => u.unitId)]);

			// Upsert units
			const unitsData = army.units.map(u => ({ ...u, armyId: army.id, id: u.id ?? null }));
			await tx.upsert('army_units', unitsData);

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
