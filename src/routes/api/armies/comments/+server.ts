import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';
import { saveComment, deleteComment } from '$server/army';

export const POST: RequestHandler = endpoint(async (req) => {
	const comment = await req.request.json();
	const id = await saveComment(req, comment);
	return json({ id }, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const id = await req.request.json();
	await deleteComment(req, id);
	return json({}, { status: 200 });
});
