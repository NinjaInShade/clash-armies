import type { LayoutLoad, LayoutLoadEvent } from './$types';
import type { AppState, TroopData, SpellData, SiegeData } from '~/lib/types';
import { CURRENT_TROOPS, CURRENT_SPELLS, CURRENT_SIEGES, OBJECT_ID_PREFIXES, NAME_TO_OBJECT_ID_NAME } from '~/lib/constants';

type BuildingsJSON = Record<string, Record<string, Record<string, string | number | boolean>>>;
type TroopsJSON = Record<string, Record<string, Record<string, string | number | boolean>>>;
type SpellsJSON = Record<string, Record<string, Record<string, string | number | boolean>>>;
type ObjectIdsJSON = Record<string, string>;
type ObjectKey = string | number;

function swapKeysAndValues(obj: Record<ObjectKey, ObjectKey>) {
	return Object.entries(obj).reduce((prev, [id, name]) => {
		prev[name] = id;
		return prev;
	}, {});
}

async function fetchJSON<T>(ev: LayoutLoadEvent, url: string): Promise<T> {
	// TODO: add error handling
	const request = await ev.fetch(url);
	const parsed: T = await request.json();
	return parsed;
}

async function getTownHalls(ev: LayoutLoadEvent) {
	const buildingData = await fetchJSON<BuildingsJSON>(ev, '/clash/buildings/buildings.json');
	const townHallLevels = Object.keys(buildingData['Town Hall']).map((lvl) => +lvl);
	return townHallLevels.map((thLevel) => {
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

async function getTroops(ev: LayoutLoadEvent, ids: ObjectIdsJSON) {
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

async function getSpells(ev: LayoutLoadEvent, ids: ObjectIdsJSON) {
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

export const load: LayoutLoad = async (ev: LayoutLoadEvent) => {
	const idsToObject = await fetchJSON<ObjectIdsJSON>(ev, '/clash/objectIds.json');
	const objectsToId = swapKeysAndValues(idsToObject); // makes it easier to lookup by object name
	const { troops, sieges } = await getTroops(ev, objectsToId);

	return {
		townHalls: await getTownHalls(ev),
		spells: await getSpells(ev, objectsToId),
		troops,
		sieges
	};
};
