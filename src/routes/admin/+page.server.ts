import type { PageServerLoad } from './$types';
import { getTownHalls, getUnits } from "~/lib/server/army";
import { redirect } from '@sveltejs/kit';
import type { Unit } from "~/lib/shared/types";
import { actionWrap } from "~/lib/server/utils";
import { db } from "~/lib/server/db";
import fs from 'node:fs/promises';
import z from 'zod';

const townHallSchema = z.object({
    id: z.number(),
    level: z.number(),
    maxBarracks: z.number().nullable(),
    maxDarkBarracks: z.number().nullable(),
    maxSpellFactory: z.number().nullable(),
    maxDarkSpellFactory: z.number().nullable(),
    maxLaboratory: z.number().nullable(),
    maxWorkshop: z.number().nullable(),
    troopCapacity: z.number(),
    siegeCapacity: z.number(),
    spellCapacity: z.number(),
    image: z
        .any()
        .optional()
        .refine((file) => file ? file.size >= 0 : true, { message: 'Image is required.' })
        .refine((file) => file?.size > 0 ? file.type === 'image/png' : true, { message: 'only .png file type is accepted.' })
})
const townHallSchemaCreating = townHallSchema.extend({
    id: z.undefined(),
    // Non-optional image
    image: z
        .any()
        .refine((file) => file?.size >= 0, { message: 'Image is required.' })
        .refine((file) => file?.type === 'image/png', { message: 'only .png file type is accepted.' })
})

const unitLevelSchema = z.object({
    id: z.number().optional(),
    unitId: z.number(),
    level: z.number(),
    spellFactoryLevel: z.number().nullable(),
    barrackLevel: z.number().nullable(),
    laboratoryLevel: z.number().nullable(),
})
const unitLevelSchemaCreating = unitLevelSchema.extend({
    id: z.undefined(),
    unitId: z.undefined(),
})

const unitSchema = z.object({
    id: z.number(),
    type: z.enum(['Troop', 'Siege', 'Spell']),
    name: z.string().max(45),
    objectId: z.number(),
    housingSpace: z.number(),
    trainingTime: z.number(),
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
        .refine((file) => file ? file.size >= 0 : true, { message: 'Image is required.' })
        .refine((file) => file?.size > 0 ? file.type === 'image/png' : true, { message: 'only .png file type is accepted.' })
})
const unitSchemaCreating = unitSchema.extend({
    id: z.undefined(),
    levels: z.array(unitLevelSchemaCreating).min(1),
    // Non-optional image
    image: z
        .any()
        .refine((file) => file?.size >= 0, { message: 'Image is required.' })
        .refine((file) => file?.type === 'image/png', { message: 'only .png file type is accepted.' })
})

export const load: PageServerLoad = async (event) => {
    event.locals.requireRoles('admin');

	return {
        units: await getUnits(),
        townHalls: await getTownHalls()
    };
};

export const actions = {
    saveTownHall: async (event) => {
        event.locals.requireRoles('admin');

        return actionWrap(async function() {
            const formData = await event.request.formData();
            const townHallData = formData.get('townHall') ?? '';
            if (townHallData instanceof File) throw new Error('Unexpected file for town hall');

            const data = JSON.parse(townHallData);
            const image = formData.get('image');
            data.image = image;

            if (!data.id) {
                // Creating town hall
                await db.transaction(async (tx) => {
                    const th = townHallSchemaCreating.parse(data);
                    await tx.insertOne('town_halls', {
                        level: th.level,
                        maxBarracks: th.maxBarracks ?? null,
                        maxDarkBarracks: th.maxDarkBarracks ?? null,
                        maxSpellFactory: th.maxSpellFactory ?? null,
                        maxDarkSpellFactory: th.maxDarkSpellFactory ?? null,
                        maxLaboratory: th.maxLaboratory ?? null,
                        maxWorkshop: th.maxWorkshop ?? null,
                        troopCapacity: th.troopCapacity,
                        siegeCapacity: th.siegeCapacity,
                        spellCapacity: th.spellCapacity
                    })
                    await fs.writeFile(`static/clash/town-halls/${th.level}.png`, Buffer.from(await th.image.arrayBuffer()));
                })
            } else {
                // Updating existing town hall
                await db.transaction(async tx => {
                    const th = townHallSchema.parse(data);
                    await tx.query(`
                        UPDATE town_halls SET
                            level = ?,
                            maxBarracks = ?,
                            maxDarkBarracks = ?,
                            maxSpellFactory = ?,
                            maxDarkSpellFactory = ?,
                            maxLaboratory = ?,
                            maxWorkshop = ?,
                            troopCapacity = ?,
                            siegeCapacity = ?,
                            spellCapacity = ?
                        WHERE level = ?
                    `, [th.level, th.maxBarracks ?? null, th.maxDarkBarracks ?? null, th.maxSpellFactory ?? null, th.maxDarkSpellFactory ?? null, th.maxLaboratory ?? null, th.maxWorkshop ?? null, th.troopCapacity, th.siegeCapacity, th.spellCapacity, data.id])
                    if (th.image && th.image.size > 0) {
                        await fs.unlink(`static/clash/town-halls/${data.id}.png`)
                        await fs.writeFile(`static/clash/town-halls/${th.level}.png`, Buffer.from(await th.image.arrayBuffer()));
                    } else {
                        await fs.rename(`static/clash/town-halls/${data.id}.png`, `static/clash/town-halls/${th.level}.png`);
                    }
                })
            }
        })
    },
    deleteTownHall: async (event) => {
        event.locals.requireRoles('admin');

        return actionWrap(async function() {
            const formData = await event.request.formData();
            const data = formData.get('level') ?? '';
            if (data instanceof File) throw new Error('Unexpected file for level field');
            const { level } = z.object({ level: z.number().positive() }).parse({ level: JSON.parse(data) });
            await db.transaction(async (tx) => {
                await tx.query('DELETE FROM town_halls WHERE level = ?', [level]);
                await fs.unlink(`static/clash/town-halls/${level}.png`);
            })
        })
    },
    saveUnit: async (event) => {
        event.locals.requireRoles('admin');

        return actionWrap(async function() {
            const formData = await event.request.formData();
            const unitData = formData.get('unit') ?? '';
            if (unitData instanceof File) throw new Error('Unexpected file for unit');

            const data = JSON.parse(unitData);
            const image = formData.get('image');
            data.image = image;

            if (!data.id) {
                // Creating unit
                const { type, name, objectId, housingSpace, trainingTime, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets, levels, image } = unitSchemaCreating.parse(data)
                await db.transaction(async tx => {
                    const insertId = await tx.insertOne('units', { type, name, objectId, housingSpace, trainingTime, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets })
                    await tx.insertMany('unit_levels', levels.map(x => ({ unitId: insertId, level: x.level, spellFactoryLevel: x.spellFactoryLevel, barrackLevel: x.barrackLevel, laboratoryLevel: x.laboratoryLevel })))
                    await fs.writeFile(`static/clash/units/${name}.png`, Buffer.from(await image.arrayBuffer()));
                })
            } else {
                // Updating existing unit
                const { id, type, name, objectId, housingSpace, trainingTime, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets, levels, image } = unitSchema.parse(data)
                await db.transaction(async tx => {
                    const existingUnit = await tx.getRow<Unit>('units', { id });
                    await tx.query(`
                        UPDATE units SET
                            type = ?,
                            name = ?,
                            objectId = ?,
                            housingSpace = ?,
                            trainingTime = ?,
                            productionBuilding = ?,
                            isSuper = ?,
                            isFlying = ?,
                            isJumper = ?,
                            airTargets = ?,
                            groundTargets = ?
                        WHERE id = ?
                    `, [type, name, objectId, housingSpace, trainingTime, productionBuilding, isSuper, isFlying, isJumper, airTargets, groundTargets, id])
                    await fs.rename(`static/clash/units/${existingUnit.name}.png`, `static/clash/units/${name}.png`);

                    // Remove deleted unit levels
                    await tx.query('DELETE FROM unit_levels WHERE unitId = ? AND id NOT IN (?)', [id, levels.map(x => x.id)]);

                    // Upsert unit levels
                    const unitsData = levels.map(x => ({ ...x, id: x.id ?? null }));
                    await tx.upsert('unit_levels', unitsData);

                    if (image && image.size > 0) {
                        await fs.writeFile(`static/clash/units/${name}.png`, Buffer.from(await image.arrayBuffer()));
                    };
                })
            }
        })
    },
    deleteUnit: async (event) => {
        event.locals.requireRoles('admin');

        return actionWrap(async function() {
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
        })
    }
};
