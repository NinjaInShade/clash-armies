import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveVote } from '$server/army';
import { endpoint } from '$server/utils';

export const POST: RequestHandler = endpoint(async (req) => {
	const data = await req.request.json();
	await saveVote(req, data);
	return json({}, { status: 200 });
});
