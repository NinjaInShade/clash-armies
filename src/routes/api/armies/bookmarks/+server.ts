import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookmarkArmy, removeBookmark } from '$server/army';
import { middleware } from '$server/utils';

export const POST: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const data = await req.request.json();
		await bookmarkArmy(req, data);
		return json({}, { status: 200 });
	});
};

export const DELETE: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const data = await req.request.json();
		await removeBookmark(req, data);
		return json({}, { status: 200 });
	});
};
