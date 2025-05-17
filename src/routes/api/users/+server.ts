import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveUser } from '$server/user';
import { endpoint } from '$server/utils';

export const POST: RequestHandler = endpoint(async (req) => {
	const user = await req.request.json();
	await saveUser(req, user);
	return json({}, { status: 200 });
});
