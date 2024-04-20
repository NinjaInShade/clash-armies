import type { Actions } from './$types';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { saveArmy, deleteArmy } from "~/lib/server/army";
import z from 'zod';

async function formDataToJSON(event: RequestEvent, key: string) {
	try {
		const formData = await event.request.formData();
		const data = formData.get(key);
		const { validated } = z.object({ validated: z.string() }).parse({ validated: data });
		return JSON.parse(validated);
	} catch (err) {
		throw new Error('Unable to parse data');
	}
}

export const actions = {
	saveArmy: async (event) => {
		try {
			const army = await formDataToJSON(event, 'army');
			const id = await saveArmy(army);
			if (!army.id) {
				// If creating army, redirect to it's page after creating
				return redirect(308, `/armies/${id}`)
			}
		} catch (err) {
			if (err instanceof z.ZodError) {
				return fail(400, err.flatten());
			} else {
				throw err;
			}
		}
	},
	deleteArmy: async (event) => {
		try {
			const id = await formDataToJSON(event, 'id');
			await deleteArmy(id);
			return redirect(308, '/armies');
		} catch (err) {
			if (err instanceof z.ZodError) {
				return fail(400, err.flatten());
			} else {
				throw err;
			}
		}
	}
} satisfies Actions;
