import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveVote } from "~/lib/server/army";
import { errCatcher } from "~/lib/server/utils";

export const POST: RequestHandler = async (event) => {
	return errCatcher(async function() {
        const data = await event.request.json();
        await saveVote(event, data);
		return json({}, { status: 200 });
	});
};
