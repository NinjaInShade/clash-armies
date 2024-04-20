import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { saveUser } from "~/lib/server/user";
import { actionWrap } from "~/lib/server/utils";
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	event.locals.requireAuth();
}

export const actions = {
	saveUser: async (event) => {
		return actionWrap(async function() {
			const user = await event.request.json();
			await saveUser(event, user);
			return redirect(308, `/users/${user.username}`);
		});
	},
} satisfies Actions;
