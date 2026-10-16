import z from 'zod';
import { endpoint } from '#server/utils.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const ids = z.array(z.number()).parse(data);
	await server.notification.acknowledge(req, ids);

	return Response.json({}, { status: 200 });
});
