import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTownHalls, getTroops, getSpells, fetchJSON, type ObjectIds } from '~/lib/server/utils';
import { getArmy } from "~/lib/server/army";
import z from 'zod';

function swapKeysAndValues(obj: Record<string, string>) {
	return Object.entries(obj).reduce<ObjectIds>((prev, [id, name]) => {
		prev[name] = id;
		return prev;
	}, {});
}

export const load: PageServerLoad = async (ev) => {
	const { id } = z.object({ id: z.number() }).parse({ id: +ev.params.slug });
	const idsToObject = await fetchJSON<ObjectIds>(ev, '/clash/objectIds.json');
	const objectsToId = swapKeysAndValues(idsToObject); // makes it easier to lookup by object name
	const townHalls = await getTownHalls(ev);
	const troops = await getTroops(ev, objectsToId);
	const spells = await getSpells(ev, objectsToId);
	const army = await getArmy({ townHalls, troops, spells, id });
	if (!army) {
		return error(404);
	}
	return { army };
};
