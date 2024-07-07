import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { middleware } from "~/lib/server/utils";
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

export const POST: RequestHandler = async (event) => {
	event.locals.requireRoles('admin')

	return middleware(event, async function() {
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
		return json({}, { status: 200 });
	});
};

export const DELETE: RequestHandler = async (event) => {
	event.locals.requireRoles('admin');

	return middleware(event, async function() {
		const formData = await event.request.formData();
		const data = formData.get('level') ?? '';
		if (data instanceof File) throw new Error('Unexpected file for level field');
		const { level } = z.object({ level: z.number().positive() }).parse({ level: JSON.parse(data) });
		await db.transaction(async (tx) => {
			await tx.query('DELETE FROM town_halls WHERE level = ?', [level]);
			await fs.unlink(`static/clash/town-halls/${level}.png`);
		})
		return json({}, { status: 200 });
	})
}
