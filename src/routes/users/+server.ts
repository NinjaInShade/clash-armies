import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveUser } from '$server/user';
import { middleware } from '$server/utils';

export const POST: RequestHandler = async (event) => {
	return middleware(event, async function () {
		const user = await event.request.json();
		await saveUser(event, user);
		return json({}, { status: 200 });
	});
};
