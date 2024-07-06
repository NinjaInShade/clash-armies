import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveUser } from "~/lib/server/user";
import { errCatcher } from "~/lib/server/utils";

export const POST: RequestHandler = async (event) => {
	return errCatcher(async function() {
		const user = await event.request.json();
		await saveUser(event, user);
		return json({}, { status: 200 });
	});
};
