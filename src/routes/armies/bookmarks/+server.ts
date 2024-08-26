import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookmarkArmy, removeBookmark } from '~/lib/server/army';
import { middleware } from '~/lib/server/utils';

export const POST: RequestHandler = async (event) => {
	return middleware(event, async function () {
		const data = await event.request.json();
		await bookmarkArmy(event, data);
		return json({}, { status: 200 });
	});
};

export const DELETE: RequestHandler = async (event) => {
	return middleware(event, async function () {
		const data = await event.request.json();
		await removeBookmark(event, data);
		return json({}, { status: 200 });
	});
};
