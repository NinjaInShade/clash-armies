import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Unit } from '$types';
import { middleware, STATIC_BASE_PATH } from '$server/utils';
import { db } from '$server/db';
import fs from 'node:fs/promises';
import z from 'zod';

const unitLevelSchema = z.object({
	id: z.number().optional(),
	unitId: z.number(),
	level: z.number(),
	spellFactoryLevel: z.number().nullable(),
	barrackLevel: z.number().nullable(),
	laboratoryLevel: z.number().nullable(),
});
const unitLevelSchemaCreating = unitLevelSchema.extend({
	id: z.undefined(),
	unitId: z.undefined(),
});

const unitSchema = z.object({
	id: z.number(),
	type: z.enum(['Troop', 'Siege', 'Spell']),
	name: z.string().max(45),
	clashId: z.number(),
	housingSpace: z.number(),
	productionBuilding: z.enum(['Barrack', 'Dark Elixir Barrack', 'Siege Workshop', 'Spell Factory', 'Dark Spell Factory']),
	isSuper: z.boolean(),
	isFlying: z.boolean(),
	isJumper: z.boolean(),
	airTargets: z.boolean(),
	groundTargets: z.boolean(),
	levels: z.array(unitLevelSchema).min(1),
	image: z
		.any()
		.optional()
		.refine((file) => (file ? file.size >= 0 : true), { message: 'Image is required.' })
		.refine((file) => (file?.size > 0 ? file.type === 'image/png' : true), { message: 'only .png file type is accepted.' }),
});
const unitSchemaCreating = unitSchema.extend({
	id: z.undefined(),
	levels: z.array(unitLevelSchemaCreating).min(1),
	// Non-optional image
	image: z
		.any()
		.refine((file) => file?.size >= 0, { message: 'Image is required.' })
		.refine((file) => file?.type === 'image/png', { message: 'only .png file type is accepted.' }),
});

export const POST: RequestHandler = async (event) => {
	return middleware(event, async function () {
		event.locals.requireRoles('admin');

		const formData = await event.request.formData();
		const unitData = formData.get('unit') ?? '';
		if (unitData instanceof File) throw new Error('Unexpected file for unit');

		const data = JSON.parse(unitData);
		const image = formData.get('image');
		data.image = image;

		if (!data.id) {
			// Creating unit
			const { type, name, clashId, housingSpace, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets, levels, image } =
				unitSchemaCreating.parse(data);
			await db.transaction(async (tx) => {
				const insertId = await tx.insertOne('units', {
					type,
					name,
					clashId,
					housingSpace,
					productionBuilding,
					isSuper,
					isFlying,
					isJumper,
					airTargets,
					groundTargets,
				});
				await tx.insertMany(
					'unit_levels',
					levels.map((x) => ({
						unitId: insertId,
						level: x.level,
						spellFactoryLevel: x.spellFactoryLevel,
						barrackLevel: x.barrackLevel,
						laboratoryLevel: x.laboratoryLevel,
					}))
				);
				await fs.writeFile(`static/clash/units/${name}.png`, Buffer.from(await image.arrayBuffer()));
			});
		} else {
			// Updating existing unit
			const { id, type, name, clashId, housingSpace, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets, levels, image } =
				unitSchema.parse(data);
			await db.transaction(async (tx) => {
				const existingUnit = await tx.getRow<Unit>('units', { id });
				await tx.query(
					`
                    UPDATE units SET
                        type = ?,
                        name = ?,
                        clashId = ?,
                        housingSpace = ?,
                        productionBuilding = ?,
                        isSuper = ?,
                        isFlying = ?,
                        isJumper = ?,
                        airTargets = ?,
                        groundTargets = ?
                    WHERE id = ?
                `,
					[type, name, clashId, housingSpace, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets, id]
				);
				await fs.rename(`${STATIC_BASE_PATH}/clash/units/${existingUnit.name}.png`, `${STATIC_BASE_PATH}/clash/units/${name}.png`);

				// Remove deleted unit levels
				await tx.query('DELETE FROM unit_levels WHERE unitId = ? AND id NOT IN (?)', [id, levels.map((x) => x.id)]);

				// Upsert unit levels
				const unitsData = levels.map((x) => ({ ...x, id: x.id ?? null }));
				await tx.upsert('unit_levels', unitsData);

				if (image && image.size > 0) {
					await fs.writeFile(`${STATIC_BASE_PATH}/clash/units/${name}.png`, Buffer.from(await image.arrayBuffer()));
				}
			});
		}
		return json({}, { status: 200 });
	});
};

export const DELETE: RequestHandler = async (event) => {
	event.locals.requireRoles('admin');

	return middleware(event, async function () {
		const formData = await event.request.formData();
		const data = formData.get('id') ?? '';
		if (data instanceof File) throw new Error('Unexpected file for ID field');
		const { id } = z.object({ id: z.number().positive() }).parse({ id: JSON.parse(data) });
		await db.transaction(async (tx) => {
			const existingUnit = await tx.getRow<Unit>('units', { id });
			if (!existingUnit) throw new Error('Expected existing unit');
			await tx.query('DELETE FROM units WHERE id = ?', [id]);
			await fs.unlink(`static/clash/units/${existingUnit.name}.png`);
		});
		return json({}, { status: 200 });
	});
};
