import type { Army } from '~/lib/types';
import { error } from '@sveltejs/kit';
import { getTownHalls, getTroops, getSpells } from "~/lib/server/utils";
import { db } from "~/lib/server/db";
import { BANNERS } from '~/lib/shared';
import z from 'zod';

type GetArmiesParams = {
	// Temporary until units/town halls are in database
	troops: Awaited<ReturnType<typeof getTroops>>;
	spells: Awaited<ReturnType<typeof getSpells>>;
	townHalls: Awaited<ReturnType<typeof getTownHalls>>;
	id?: number;
};

type GetArmyParams = {
	troops: Awaited<ReturnType<typeof getTroops>>;
	spells: Awaited<ReturnType<typeof getSpells>>;
	townHalls: Awaited<ReturnType<typeof getTownHalls>>;
	id: number;
}

type ArmyWithCapacity = (Army & { armyCapacity: { troop: number; spell: number; siege: number } });

export async function getArmies(opts: GetArmiesParams) {
	const { id, townHalls } = opts;

	const args: number[] = [];
	let query = `
        SELECT
			a.*,
			u.username,
            JSON_ARRAYAGG(JSON_OBJECT(
                'id', au.id,
                'name', au.name,
                'amount', au.amount
            )) AS units
		FROM armies a
		LEFT JOIN users u ON u.id = a.createdBy
        LEFT JOIN army_units au ON au.armyId = a.id
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

	const armies = await db.query<ArmyWithCapacity>(query, args);

	for (const army of armies) {
		// Parse JSON units
		army.units = JSON.parse(army.units);

		// attach unit data (temporary)
		for (const unit of army.units) {
			const troopData = opts.troops.troops[unit.name];
			const spellData = opts.spells[unit.name];
			const siegeData = opts.troops.sieges[unit.name];
			if (troopData !== undefined) {
				unit.data = troopData;
				unit.type = 'Troop';
			} else if (spellData) {
				unit.data = spellData;
				unit.type = 'Spell';
			} else {
				unit.data = siegeData;
				unit.type = 'Siege';
			}
		}

		// attach capacity (temporary)
		const thData = townHalls.find((t) => t.level === army.townHall);
		if (!thData) {
			return error(500);
		}
		army.armyCapacity = { troop: thData.troopCapacity, spell: thData.spellCapacity, siege: thData.siegeCapacity };
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

const unitSchemaCreating = z.object({
	id: z.number().positive().optional(),
	name: z.string().min(1).max(45),
	amount: z.number().positive()
})
const armySchemaCreating = z.object({
	id: z.number().positive().optional(),
	name: z.string().min(5).max(25),
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
			await tx.insertMany('army_units', army.units.map((unit) => ({ armyId: _armyId, name: unit.name, amount: unit.amount })));
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
				INSERT INTO army_units (id, armyId, name, amount) VALUES
			`;
			query += army.units.map((u) => {
				args.push(u.id ?? null, army.id, u.name, u.amount);
				return `(?, ?, ?, ?)`
			}).join(',\n')
			query += `
				ON DUPLICATE KEY UPDATE
					id = VALUES(id),
					armyId = VALUES(armyId),
					name = VALUES(name),
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
