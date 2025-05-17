import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { middleware } from '$server/utils';
import { acknowledgeNotifications } from '$server/notifications';

export const POST: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const ids = await req.request.json();
		await acknowledgeNotifications(req, ids);
		return json({}, { status: 200 });
	});
};
