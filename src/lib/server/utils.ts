import type { ServerLoadEvent } from '@sveltejs/kit';

import type { AppState, TroopData, SpellData, SiegeData, BuildingName, BuildingData } from '~/lib/types';
import { CURRENT_TROOPS, CURRENT_SPELLS, CURRENT_SIEGES, OBJECT_ID_PREFIXES, NAME_TO_OBJECT_ID_NAME, TROOP_CAPACITY_BY_TH } from '~/lib/constants';

type BuildingsJSON = Record<BuildingName, BuildingData>;
type TroopsJSON = Record<string, Record<string, Record<string, string | number | boolean>>>;
type SpellsJSON = Record<string, Record<string, Record<string, string | number | boolean>>>;
export type ObjectIds = Record<string, string>;

export async function fetchJSON<T>(ev: ServerLoadEvent, url: string): Promise<T> {
	// TODO: add error handling
	const request = await ev.fetch(url);
	const parsed: T = await request.json();
	return parsed;
}

export async function getTownHalls(ev: ServerLoadEvent) {
	const buildingData = await fetchJSON<BuildingsJSON>(ev, '/clash/buildings/buildings.json');
	const townHallLevels = Object.keys(buildingData['Town Hall']).map((lvl) => +lvl);
	return townHallLevels.map((thLevel) => {
		/** Finds the max level building that is unlocked for the current townhall */
		const findMaxLevel = (name: BuildingName) => {
			let maxLevelBuilding: Record<string, string | number | boolean | undefined> = {};
			for (const level of Object.values(buildingData[name])) {
				const requiredTHLevel = level.TownHallLevel;
				const buildingLevel = level.BuildingLevel;
				if (typeof requiredTHLevel !== 'number') {
					throw new Error('Expected buildings required town hall level to be a number');
				}
				if (typeof buildingLevel !== 'number') {
					throw new Error('Expected buildings level to be a number');
				}
				if (requiredTHLevel <= thLevel) {
					maxLevelBuilding = level;
				} else {
					break;
				}
			}
			return maxLevelBuilding;
		};

		const barracks = findMaxLevel('Barracks');
		const darkBarracks = findMaxLevel('Dark Barracks');
		const lab = findMaxLevel('Laboratory');
		const spellFactory = findMaxLevel('Spell Factory');
		const darkSpellFactory = findMaxLevel('Dark Spell Factory');
		const workshop = findMaxLevel('Workshop');

		const spellHousing = spellFactory.HousingSpaceAlt;
		const darkSpellHousing = darkSpellFactory.HousingSpaceAlt;
		if ((spellHousing !== undefined && typeof spellHousing !== 'number') || (darkSpellHousing !== undefined && typeof darkSpellHousing !== 'number')) {
			throw new Error('Expected spell factory housing space to be a number');
		}

		const troopCapacity = TROOP_CAPACITY_BY_TH[thLevel]; // TODO: fix this, look at definition for more information
		const spellCapacity = (spellHousing ?? 0) + (darkSpellHousing ?? 0);
		const siegeCapacity = workshop.BuildingLevel ? 1 : 0; // can't find a dynamic way of finding this out, but I don't see this changing anyway so fine for now

		return {
			level: thLevel,
			maxBarracks: barracks.BuildingLevel ?? -1,
			maxDarkBarracks: darkBarracks.BuildingLevel ?? -1,
			maxLaboratory: lab.BuildingLevel ?? -1,
			maxSpellFactory: spellFactory.BuildingLevel ?? -1,
			maxDarkSpellFactory: darkSpellFactory.BuildingLevel ?? -1,
			maxWorkshop: workshop.BuildingLevel ?? -1,
			troopCapacity: troopCapacity,
			spellCapacity: spellCapacity,
			siegeCapacity: siegeCapacity
		};
	});
}
export async function getTroops(ev: ServerLoadEvent, ids: ObjectIds) {
	// TODO: improve name typing & type check error message
	const data = await fetchJSON<TroopsJSON>(ev, '/clash/troops/troops.json');
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
			const { BarrackLevel, LaboratoryLevel, HousingSpace, TrainingTime, ProductionBuilding, EnabledBySuperLicence = false } = levelData;
			if (typeof BarrackLevel !== 'number' || typeof LaboratoryLevel !== 'number' || typeof HousingSpace !== 'number' || typeof TrainingTime !== 'number') {
				throw new Error('Expected number value from static JSON');
			}
			if (ProductionBuilding !== 'Barrack' && ProductionBuilding !== 'Dark Elixir Barrack' && ProductionBuilding !== 'Siege Workshop') {
				throw new Error(`Expected valid production building, got "${ProductionBuilding}" for troop "${name}"`);
			}
			if (typeof EnabledBySuperLicence !== 'boolean') {
				throw new Error(`Can't determine if troop "${name}" is super or not`);
			}
			const id = ids[NAME_TO_OBJECT_ID_NAME[name] ?? name];
			if (!id) {
				throw new Error(`Cannot find ID for troop "${name}"`);
			}
			const parsedId = +id.slice(String(OBJECT_ID_PREFIXES.Characters).length);
			prev[+level] = {
				id: parsedId,
				barrackLevel: BarrackLevel,
				laboratoryLevel: LaboratoryLevel,
				housingSpace: HousingSpace,
				trainingTime: TrainingTime,
				productionBuilding: ProductionBuilding,
				isSuper: EnabledBySuperLicence
			};
			return prev;
		}, {});
	});
	return { troops, sieges };
}

export async function getSpells(ev: ServerLoadEvent, ids: ObjectIds) {
	// TODO: improve name typing & type check error message
	const data = await fetchJSON<SpellsJSON>(ev, '/clash/spells/spells.json');
	const spells = {} as AppState['spells'];

	Object.entries(data).forEach(([name, data]) => {
		const truncatedName = name.replace(' Spell', '');
		if (!CURRENT_SPELLS.includes(truncatedName)) {
			return;
		}
		spells[truncatedName] = Object.entries(data).reduce<SpellData>((prev, [level, levelData]) => {
			const { SpellForgeLevel, LaboratoryLevel, HousingSpace, TrainingTime, ProductionBuilding } = levelData;
			if (typeof SpellForgeLevel !== 'number' || typeof LaboratoryLevel !== 'number' || typeof HousingSpace !== 'number' || typeof TrainingTime !== 'number') {
				throw new Error('Expected number value for static JSON');
			}
			if (ProductionBuilding !== 'Spell Factory' && ProductionBuilding !== 'Dark Spell Factory') {
				throw new Error(`Expected valid production building, got "${ProductionBuilding}"  for spell "${name}"`);
			}
			const id = ids[NAME_TO_OBJECT_ID_NAME[name] ?? name];
			if (!id) {
				throw new Error(`Cannot find ID for troop "${name}"`);
			}
			const parsedId = +id.slice(String(OBJECT_ID_PREFIXES.Spells).length);
			prev[+level] = {
				id: parsedId,
				spellFactoryLevel: SpellForgeLevel,
				laboratoryLevel: LaboratoryLevel,
				housingSpace: HousingSpace,
				trainingTime: TrainingTime,
				productionBuilding: ProductionBuilding
			};
			return prev;
		}, {});
	});
	return spells;
}
