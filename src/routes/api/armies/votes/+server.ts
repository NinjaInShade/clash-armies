import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveVote } from '$server/army';
import { middleware } from '$server/utils';

export const POST: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const data = await req.request.json();
		await saveVote(req, data);
		return json({}, { status: 200 });
	});
};
