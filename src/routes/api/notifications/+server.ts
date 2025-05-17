import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';
import { acknowledgeNotifications } from '$server/notifications';

export const POST: RequestHandler = endpoint(async (req) => {
	const ids = await req.request.json();
	await acknowledgeNotifications(req, ids);
	return json({}, { status: 200 });
});
