import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { middleware } from '~/lib/server/utils';
import { saveComment, deleteComment } from '~/lib/server/army';

export const POST: RequestHandler = async (event) => {
	return middleware(event, async function () {
		const comment = await event.request.json();
		const id = await saveComment(event, comment);
		return json({ id }, { status: 200 });
	});
};

export const DELETE: RequestHandler = async (event) => {
	return middleware(event, async function () {
		const id = await event.request.json();
		await deleteComment(event, id);
		return json({}, { status: 200 });
	});
};
