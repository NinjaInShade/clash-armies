import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveUser } from '$server/user';
import { middleware } from '$server/utils';

export const POST: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const user = await req.request.json();
		await saveUser(req, user);
		return json({}, { status: 200 });
	});
};
