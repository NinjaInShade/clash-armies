import type { Army, TownHall, Unit, UnitType } from '~/lib/shared/types';
import { db } from "~/lib/server/db";
import { BANNERS } from '~/lib/shared/utils';
import z from 'zod';

type GetArmiesParams = {
	id?: number;
};

type GetArmyParams = {
	id: number;
}

type GetUnitsParams = {
	type?: UnitType;
}

export async function getArmies(opts: GetArmiesParams = {}) {
	const { id } = opts;

	const args: number[] = [];
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

export async function getArmy(opts: GetArmyParams) {
	z.object({ id: z.number() }).parse({ id: opts.id });
	const armies = await getArmies(opts);
	if (!armies.length) {
		return null;
	}
	return armies[0];
}

export async function getTownHalls() {
	return db.getRows<TownHall>('town_halls');
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

export async function saveArmy(data: Partial<Army>) {
	let _armyId: number | null = null;

	if (!data.id) {
		// Creating army
		const army = armySchemaCreating.parse(data);
		await db.transaction(async (tx) => {
			_armyId = await tx.insertOne('armies', {
				name: army.name,
				townHall: army.townHall,
				banner: army.banner,
				createdBy: 1, // TODO: change to id of logged in user when auth added
			});
			await tx.insertMany('army_units', army.units.map((unit) => ({ armyId: _armyId, unitId: unit.unitId, amount: unit.amount })));
		});
	} else {
		// Updating existing army
		const army = armySchemaSaving.parse(data);
		await db.transaction(async (tx) => {
			// Update army
			await tx.query(`
				UPDATE armies SET
					name = ?,
					townHall = ?,
					banner = ?
				WHERE id = ?
			`, [army.name, army.townHall, army.banner, army.id])
			await tx.query('DELETE FROM army_units WHERE armyId = ?', [army.id]);

			// Upsert units (TODO: move into @ninjalib/sql)
			const args: (string | number | null)[] = []
			let query = `
				INSERT INTO army_units (id, armyId, unitId, amount) VALUES
			`;
			query += army.units.map((u) => {
				args.push(u.id ?? null, army.id, u.unitId, u.amount);
				return `(?, ?, ?, ?)`
			}).join(',\n')
			query += `
				ON DUPLICATE KEY UPDATE
					id = VALUES(id),
					armyId = VALUES(armyId),
					unitId = VALUES(unitId),
					amount = VALUES(amount)
			`;
			await tx.query(query, args);
		});
		_armyId = army.id;
	}

	const { armyId } = z.object({ armyId: z.number().positive() }).parse({ armyId: _armyId });
	return armyId;
}

export async function deleteArmy(armyId: number) {
	const { id } = z.object({ id: z.number() }).parse({ id: armyId });
	await db.query('DELETE FROM armies WHERE id = ?', [id]);
}
