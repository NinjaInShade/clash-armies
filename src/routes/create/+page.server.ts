import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { saveArmy, deleteArmy } from "~/lib/server/army";
import { actionWrap } from "~/lib/server/utils";

export const actions = {
	saveArmy: async (event) => {
		return actionWrap(async function() {
			const army = await event.request.json();
			const id = await saveArmy(army);
			if (!army.id) {
				// If creating army, redirect to it's page after creating
				return redirect(308, `/armies/${id}`)
			}
		});
	},
	deleteArmy: async (event) => {
		return actionWrap(async function() {
			const id = await event.request.json();
			await deleteArmy(id);
			return redirect(308, '/armies');
		});
	}
} satisfies Actions;
