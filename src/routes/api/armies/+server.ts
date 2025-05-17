import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { endpoint } from '$server/utils';
import { saveArmy, deleteArmy } from '$server/army';

export const POST: RequestHandler = endpoint(async (req) => {
	const army = await req.request.json();
	const id = await saveArmy(req, army);
	return json({ id }, { status: 200 });
});

export const DELETE: RequestHandler = endpoint(async (req) => {
	const id = await req.request.json();
	await deleteArmy(req, id);
	return json({}, { status: 200 });
});
