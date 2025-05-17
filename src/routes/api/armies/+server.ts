import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { middleware } from '$server/utils';
import { saveArmy, deleteArmy } from '$server/army';

export const POST: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const army = await req.request.json();
		const id = await saveArmy(req, army);
		return json({ id }, { status: 200 });
	});
};

export const DELETE: RequestHandler = async (req) => {
	return middleware(req, async function () {
		const id = await req.request.json();
		await deleteArmy(req, id);
		return json({}, { status: 200 });
	});
};
