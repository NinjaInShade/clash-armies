import { json } from '@sveltejs/kit';
import z from 'zod';
import { endpoint } from '$server/utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = endpoint(async (req) => {
	const server = req.locals.server;
	const data = await req.request.json();
	const dataSchema = z.object({ armyId: z.number(), vote: z.number() });

	const voteOptions = dataSchema.parse(data);
	await server.army.saveVote(req, voteOptions);

	return json({}, { status: 200 });
});
