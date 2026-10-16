import z from 'zod';
import { endpoint } from '#server/utils.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const army = await req.request.json();

	const armyId = await server.army.saveArmy(req, army);

	return Response.json(armyId, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const armyId = z.number().parse(data);
	await server.army.deleteArmy(req, armyId);

	return Response.json({}, { status: 200 });
});
