import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';
import z from 'zod';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const comment = await req.request.json();

	const id = await server.army.saveComment(req, comment);

	return json({ id }, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();

	const commentId = z.number().parse(data);
	await server.army.deleteComment(req, commentId);

	return json({}, { status: 200 });
});
