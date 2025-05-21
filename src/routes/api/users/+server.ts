import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const user = await req.request.json();

	await server.user.saveUser(req, user);

	return json({}, { status: 200 });
});
