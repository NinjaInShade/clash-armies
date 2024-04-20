import type { LayoutServerLoad, LayoutServerLoadEvent } from './$types';
import { fetchJSON, getTroops, getSpells, getTownHalls, type ObjectIds } from '~/lib/server/utils';

function swapKeysAndValues(obj: Record<string, string>) {
	return Object.entries(obj).reduce<ObjectIds>((prev, [id, name]) => {
		prev[name] = id;
		return prev;
	}, {});
}

export const load: LayoutServerLoad = async (ev: LayoutServerLoadEvent) => {
	const idsToObject = await fetchJSON<ObjectIds>(ev, '/clash/objectIds.json');
	const objectsToId = swapKeysAndValues(idsToObject); // makes it easier to lookup by object name
	const { troops, sieges } = await getTroops(ev, objectsToId);

	return {
		townHalls: await getTownHalls(ev),
		spells: await getSpells(ev, objectsToId),
		troops,
		sieges
	};
};
