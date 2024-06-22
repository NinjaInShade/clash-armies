import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { saveArmy, deleteArmy, saveVote } from '~/lib/server/army';
import { actionWrap } from '~/lib/server/utils';

export const load: PageServerLoad = async (event) => {
	event.locals.requireAuth();
}

export const actions = {
	saveArmy: async (event) => {
		return actionWrap(async function() {
			const army = await event.request.json();
			const id = await saveArmy(event, army);
			if (!army.id) {
				// If creating army, redirect to it's page after creating
				return redirect(308, `/armies/${id}`)
			}
		});
	},
	deleteArmy: async (event) => {
		return actionWrap(async function() {
			const id = await event.request.json();
			await deleteArmy(event, id);
			return redirect(308, '/armies');
		});
	},
	saveVote: async (event) => {
		return actionWrap(async function () {
			const data = await event.request.json();
			await saveVote(event, data);
		});
	}
} satisfies Actions;
