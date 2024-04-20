import type { LayoutLoad, LayoutLoadEvent } from './$types';
import type { AppState, TroopData, Troops, SpellData, Spells, SiegeData, Sieges } from "~/lib/state.svelte";
import { CURRENT_TROOPS, CURRENT_SPELLS, CURRENT_SIEGES } from "~/lib/state.svelte";

// TODO: disable troops not available at town hall level
// TODO: display troop level in Troop.svelte
// TODO: click to add troop to army
// TODO: display total capacity used

type RawTownHallData = Record<string, number>[];
type RawTroopData = Record<string, Record<string, Record<string, string | number | boolean>>>;
type RawSpellData = Record<string, Record<string, Record<string, string | number | boolean>>>;

async function fetchJSON<T>(ev: LayoutLoadEvent, url: string): Promise<T> {
    // TODO: add error handling
    const request = await ev.fetch(url);
    const parsed: T = await request.json();
    return parsed;
}

async function getTownHalls(ev: LayoutLoadEvent): Promise<AppState['townHallLevels']> {
    const data = await fetchJSON<RawTownHallData>(ev, '/clash/town-halls/townhall_levels.json');
    return Array.from({ length: data.length }, (_, i) => i + 1);
}

async function getTroops(ev: LayoutLoadEvent): Promise<{ troops: Troops, sieges: Sieges }> {
    // TODO: improve name typing & type check error message
    const data = await fetchJSON<RawTroopData>(ev, '/clash/troops/troops.json');
    const troops: Troops = {};
    const sieges: Sieges = {};

    Object.entries(data).forEach(([name, data]) => {
        const isTroop = CURRENT_TROOPS.includes(name);
        const isSiege = CURRENT_SIEGES.includes(name);
        if (!isTroop && !isSiege) {
            return;
        }
        const resultObject = isSiege ? sieges : troops;
        resultObject[name] = Object.entries(data).reduce<TroopData | SiegeData>((prev, [level, levelData]) => {
            const { BarrackLevel, LaboratoryLevel, HousingSpace, TrainingTime } = levelData;
            if (typeof BarrackLevel !== 'number' || typeof LaboratoryLevel !== 'number' || typeof HousingSpace !== 'number' || typeof TrainingTime !== 'number') {
                throw new Error('Expected number value from static JSON');
            }
            prev[+level] = {
                barrackLevel: BarrackLevel,
                laboratoryLevel: LaboratoryLevel,
                housingSpace: HousingSpace,
                trainingTime: TrainingTime
            }
            return prev;
        }, {});
    })
    return { troops, sieges };
}

async function getSpells(ev: LayoutLoadEvent): Promise<Spells> {
    // TODO: improve name typing & type check error message
    const data = await fetchJSON<RawSpellData>(ev, '/clash/spells/spells.json');
    const spells: Spells = {};

    Object.entries(data).forEach(([name, data]) => {
        const truncatedName = name.replace(' Spell', '');
        if (!CURRENT_SPELLS.includes(truncatedName)) {
            return;
        }
        spells[truncatedName] = Object.entries(data).reduce<SpellData>((prev, [level, levelData]) => {
            const { SpellForgeLevel, LaboratoryLevel, HousingSpace, TrainingTime } = levelData;
            if (typeof SpellForgeLevel !== 'number' || typeof LaboratoryLevel !== 'number' || typeof HousingSpace !== 'number' || typeof TrainingTime !== 'number') {
                throw new Error('Expected number value for static JSON');
            }
            prev[+level] = {
                spellFactoryLevel: SpellForgeLevel,
                laboratoryLevel: LaboratoryLevel,
                housingSpace: HousingSpace,
                trainingTime: TrainingTime
            }
            return prev;
        }, {});
    })
    return spells;
}

export const load: LayoutLoad = async (ev: LayoutLoadEvent) => {
    const { troops, sieges } = await getTroops(ev);

	return {
		townHalls: await getTownHalls(ev),
        spells: await getSpells(ev),
        troops,
        sieges,
	};
};
