import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { errCatcher } from "~/lib/server/utils";
import { saveArmy, deleteArmy } from '~/lib/server/army';

export const POST: RequestHandler = async (event) => {
    return errCatcher(async function() {
        const army = await event.request.json();
        const id = await saveArmy(event, army);
        return json({ id }, { status: 200 })
    })
}

export const DELETE: RequestHandler = async (event) => {
    return errCatcher(async function() {
        const id = await event.request.json();
        await deleteArmy(event, id);
        return json({}, { status: 200 });
    });
};
