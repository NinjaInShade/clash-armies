import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';
import z from 'zod';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const ids = z.array(z.number()).parse(data);
	await server.notification.acknowledge(req, ids);

	return json({}, { status: 200 });
});
