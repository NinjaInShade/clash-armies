import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { middleware } from '$server/utils';
import { acknowledgeNotifications } from '$server/notifications';

export const POST: RequestHandler = async (event) => {
	return middleware(event, async function () {
		const ids = await event.request.json();
		await acknowledgeNotifications(event, ids);
		return json({}, { status: 200 });
	});
};
