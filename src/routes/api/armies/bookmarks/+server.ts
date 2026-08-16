import { json } from '@sveltejs/kit';
import z from 'zod';
import { endpoint } from '$server/utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const armyId = z.number().parse(data);
	await server.army.bookmark(req, armyId);

	return json({}, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const armyId = z.number().parse(data);
	await server.army.removeBookmark(req, armyId);

	return json({}, { status: 200 });
});
