import type { LayoutLoad, LayoutLoadEvent } from './$types';

async function getTownHalls(ev: LayoutLoadEvent) {
    // TODO: add error handling
    const request = await ev.fetch('/clash/town-halls/townhall_levels.json');
    const parsed: Record<string, number>[] = await request.json();
    return Array.from({ length: parsed.length }, (_, i) => i + 1);
}


export const load: LayoutLoad = async (ev: LayoutLoadEvent) => {
	return {
		townHalls: await getTownHalls(ev)
	};
};
