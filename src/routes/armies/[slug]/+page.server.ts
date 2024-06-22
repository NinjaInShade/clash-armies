import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getArmy } from "~/lib/server/army";
import { db } from '~/lib/server/db';
import z from 'zod';

export const load: PageServerLoad = async (ev) => {
	const { id } = z.object({ id: z.number() }).parse({ id: +ev.params.slug });
	const army = await getArmy(id);
	if (!army) {
		return error(404);
	}
	const userId = ev.locals.user?.id;
	let userVote = 0;
	if (userId) {
		const vote = (await db.query('SELECT vote FROM army_votes WHERE armyId = ? AND votedBy = ?', [army.id, userId]))[0];
		userVote = vote?.vote ?? 0;
	} else {
		userVote = 0;
	}
	return { army, userVote };
};
