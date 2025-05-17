import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookmarkArmy, removeBookmark } from '$server/army';
import { endpoint } from '$server/utils';

export const POST: RequestHandler = endpoint(async (req) => {
	const data = await req.request.json();
	await bookmarkArmy(req, data);
	return json({}, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const data = await req.request.json();
	await removeBookmark(req, data);
	return json({}, { status: 200 });
});
