import type { LayoutLoad, LayoutLoadEvent } from './$types';
import type { AppState, TroopData, SpellData, SiegeData } from '~/lib/types';
import { CURRENT_TROOPS, CURRENT_SPELLS, CURRENT_SIEGES } from '~/lib/constants';

// TODO: disable troops not available at town hall level
// TODO: display troop level in Troop.svelte
// TODO: click to add troop to army
// TODO: display total capacity used

type RawBuildingData = Record<string, Record<string, Record<string, string | number | boolean>>>;
type RawTownHallData = Record<string, number>[];
type RawTroopData = Record<string, Record<string, Record<string, string | number | boolean>>>;
type RawSpellData = Record<string, Record<string, Record<string, string | number | boolean>>>;

async function fetchJSON<T>(ev: LayoutLoadEvent, url: string): Promise<T> {
	// TODO: add error handling
	const request = await ev.fetch(url);
	const parsed: T = await request.json();
	return parsed;
}

async function getTownHalls(ev: LayoutLoadEvent): Promise<AppState['townHalls']> {
	// TODO: we shouldn't need to fetch townhalls, just get thdata from buildings
	const buildingData = await fetchJSON<RawBuildingData>(ev, '/clash/buildings/buildings.json');
	const townHallData = await fetchJSON<RawTownHallData>(ev, '/clash/buildings/townHalls.json');
	return townHallData.map((th, i) => {
		const thLevel = i + 1;

		const findMaxLevel = (buildingType: 'Barracks' | 'Dark Barracks' | 'Laboratory' | 'Spell Factory' | 'Dark Spell Factory' | 'Workshop') => {
			const availableBuildingLevels = Object.values(buildingData[buildingType]).reduce<number[]>((prev, curr) => {
				const requiredTHLevel = curr.TownHallLevel;
				const buildingLevel = curr.BuildingLevel;

				if (typeof requiredTHLevel !== 'number') {
					throw new Error('Expected buildings required town hall level to be a number');
				}
				if (typeof buildingLevel !== 'number') {
					throw new Error('Expected buildings level to be a number');
				}
				if (requiredTHLevel <= thLevel) {
					prev.push(buildingLevel);
				}
				return prev;
			}, []);
			if (!availableBuildingLevels.length) {
				// prevents Math.max() returning -Infinity and allows us to
				// differentiate between not found/undefined and not unlocked yet
				return -1;
			}
			return Math.max(...availableBuildingLevels);
		};

		return {
			level: thLevel,
			maxBarracks: findMaxLevel('Barracks'),
			maxDarkBarracks: findMaxLevel('Dark Barracks'),
			maxLaboratory: findMaxLevel('Laboratory'),
			maxSpellFactory: findMaxLevel('Spell Factory'),
			maxDarkSpellFactory: findMaxLevel('Dark Spell Factory'),
			maxWorkshop: findMaxLevel('Workshop')
		};
	});
}

async function getTroops(ev: LayoutLoadEvent): Promise<{ troops: AppState['troops']; sieges: AppState['sieges'] }> {
	// TODO: improve name typing & type check error message
	const data = await fetchJSON<RawTroopData>(ev, '/clash/troops/troops.json');
	const troops = {} as AppState['troops'];
	const sieges = {} as AppState['sieges'];

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
			};
			return prev;
		}, {});
	});
	return { troops, sieges };
}

async function getSpells(ev: LayoutLoadEvent): Promise<AppState['spells']> {
	// TODO: improve name typing & type check error message
	const data = await fetchJSON<RawSpellData>(ev, '/clash/spells/spells.json');
	const spells = {} as AppState['spells'];

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
			};
			return prev;
		}, {});
	});
	return spells;
}

export const load: LayoutLoad = async (ev: LayoutLoadEvent) => {
	const { troops, sieges } = await getTroops(ev);

	return {
		townHalls: await getTownHalls(ev),
		spells: await getSpells(ev),
		troops,
		sieges
	};
};
