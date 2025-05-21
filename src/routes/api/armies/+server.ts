import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import z from 'zod';
import { endpoint } from '$server/utils';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const army = await req.request.json();

	const armyId = await server.army.saveArmy(req, army);

	return json(armyId, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const armyId = z.number().parse(data);
	await server.army.deleteArmy(req, armyId);

	return json({}, { status: 200 });
});
