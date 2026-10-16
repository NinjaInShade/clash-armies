import { encodeUnitName } from '#shared/utils.ts';

export type TownHall = {
	level: number;
	/** Max barracks level at this town hall */
	maxBarracks: number;
	/** Max dark barracks level at this town hall - null means not unlocked yet. */
	maxDarkBarracks: number | null;
	/** Max laboratory level at this town hall - null means not unlocked yet. */
	maxLaboratory: number | null;
	/** Max spell factory level at this town hall - null means not unlocked yet. */
	maxSpellFactory: number | null;
	/** Max dark spell factory level at this town hall - null means not unlocked yet. */
	maxDarkSpellFactory: number | null;
	/** Max workshop level at this town hall - null means not unlocked yet. */
	maxWorkshop: number | null;
	/** Max clan castle level at this town hall - null means not unlocked yet. */
	maxCc: number | null;
	/** Max blacksmith level at this town hall - null means not unlocked yet. */
	maxBlacksmith: number | null;
	/** Max pet house level at this town hall - null means not unlocked yet. */
	maxPetHouse: number | null;
	/**
	 * Max level per hero at this town hall.
	 * At a lower town hall, this may be fully or partially empty (since some heroes may not be unlocked).
	 */
	heroMaxLevels: Partial<Record<string, number>>;
	/** Max available troops at this town hall (assuming max army camp). */
	troopCapacity: number;
	/** Max available spells at this town hall (assuming max spell factory). */
	spellCapacity: number;
	/** Max available siege machines at this town hall (assuming max workshop). */
	siegeCapacity: number;
	/** TODO: document */
	ccLaboratoryCap: number;
	/** Max available clan castle troops at this town hall (assuming max clan castle). */
	ccTroopCapacity: number;
	/** Max available clan castle spells at this town hall (assuming max clan castle). */
	ccSpellCapacity: number;
	/** Max available clan castle siege machines at this town hall (assuming max clan castle). */
	ccSiegeCapacity: number;
};

export type UnitType = 'Troop' | 'Siege' | 'Spell';

export type Hero = {
	name: string;
	clashId: number;
	order: number;
};

export type BlackSmithLevel = {
	id: number;
	level: number;
	maxCommon: number;
	maxEpic: number;
};

export type UnitLevel = {
	id: number;
	unitId: number;
	level: number;
	/**
	 * Min production building level required to unlock this unit level.
	 * Building is determined by `Unit.productionBuilding` (Barrack, Spell Factory, Workshop, etc...).
	 * A null value means this level is not gated by a production building.
	 */
	buildingLevel: number | null;
	/**
	 * Min laboratory level required to upgrade to this unit level.
	 * A null value generally means level 1 (auto-unlocked when the unit itself is unlocked).
	 */
	laboratoryLevel: number | null;
};

export type EquipmentLevel = {
	equipmentId: number;
	level: number;
	/**
	 * Min blacksmith required to unlock this equipment level.
	 * A null value means no specific blacksmith level required.
	 */
	blacksmithLevel: number | null;
};

export type PetLevel = {
	id: number;
	petId: number;
	level: number;
	/**
	 * Min pet house level required to unlock this pet level.
	 * A null value means no specific pet house level required.
	 */
	petHouseLevel: number | null;
};

export type Unit = {
	/** ID of the unit in the `units` table */
	id: number;
	type: UnitType;
	name: string;
	clashId: number;
	order: number;
	housingSpace: number;
	/**
	 * Which building produces this unit (e.g. Barrack, Spell Factory, etc...).
	 */
	productionBuilding: string;
	/**
	 * True for super troop variants (e.g. Super Barbarian).
	 * Max level mirrors the regular variant.
	 */
	isSuper: boolean;
	isFlying: boolean;
	isJumper: boolean;
	airTargets: boolean;
	groundTargets: boolean;
	levels: UnitLevel[];
};

export type Equipment = {
	/** ID of the hero equipment in the `equipment` table */
	id: number;
	/** Which hero this equipment can be applied to */
	hero: string;
	name: string;
	clashId: number;
	order: number;
	/** True for epic-tier equipment. */
	epic: boolean;
	levels: EquipmentLevel[];
};

export type Pet = {
	/** ID of the pet in the `pets` table */
	id: number;
	name: string;
	clashId: number;
	order: number;
	levels: PetLevel[];
};

/**
 * Static game data, shared and never mutated (only ever replaced entirely).
 */
export type StaticGameData = {
	units: readonly Unit[];
	townHalls: readonly TownHall[];
	equipment: readonly Equipment[];
	pets: readonly Pet[];
	heroes: readonly Hero[];
	/**
	 * Units grouped by type.
	 */
	unitsByType: Record<UnitType, readonly Unit[]>;
	/**
	 * Indexed lookups over the game data above.
	 */
	index: GameDataIndex;
};

/**
 * Indexed lookups for the static game data.
 */
export type GameDataIndex = {
	/**
	 * Every unit, regardless of type.
	 *
	 * Prefer the type-specific lookups where the type is known.
	 */
	units: Lookup<Unit>;
	troops: Lookup<Unit>;
	sieges: Lookup<Unit>;
	spells: Lookup<Unit>;
	pets: Lookup<Pet>;
	equipment: Lookup<Equipment>;
	heroes: HeroLookup;
	townHalls: TownHallLookup;
};

export type Lookup<T> = {
	byId(id: number): T | undefined;
	byName(name: string): T | undefined;
	byClashId(clashId: number): T | undefined;
	/**
	 * Lookup by the URL slug of the name (see {@link encodeUnitName})
	 */
	bySlug(slug: string): T | undefined;
	/**
	 * List of all names that {@link Lookup.byName} resolves.
	 */
	names: readonly string[];
	/**
	 * List of all slugs that {@link Lookup.bySlug} resolves.
	 */
	slugs: readonly string[];
};

/**
 * Heroes are keyed by name, so have no ID.
 */
export type HeroLookup = Omit<Lookup<Hero>, 'byId'>;

export type TownHallLookup = {
	byLevel(level: number): TownHall | undefined;
	/**
	 * List of all valid town hall levels.
	 */
	levels: readonly number[];
};

type Indexable = { id: number; name: string; clashId: number };

/**
 * Game data as loaded, before anything is derived from it.
 */
export type RawGameData = Omit<StaticGameData, 'unitsByType' | 'index'>;

/**
 * Derives the grouped lists and lookup index from the raw game data, so they're always built/replaced together.
 *
 * This walks every array, so build it once per data set and hold onto it.
 */
export function createStaticGameData(data: RawGameData): StaticGameData {
	const unitsByType: Record<UnitType, Unit[]> = { Troop: [], Siege: [], Spell: [] };
	for (const unit of data.units) {
		unitsByType[unit.type].push(unit);
	}
	return { ...data, unitsByType, index: buildGameDataIndex(data, unitsByType) };
}

function buildGameDataIndex(data: RawGameData, unitsByType: StaticGameData['unitsByType']): GameDataIndex {
	const { units, pets, equipment, heroes, townHalls } = data;
	return {
		units: createLookup(units),
		troops: createLookup(unitsByType.Troop),
		sieges: createLookup(unitsByType.Siege),
		spells: createLookup(unitsByType.Spell),
		pets: createLookup(pets),
		equipment: createLookup(equipment),
		heroes: createHeroLookup(heroes),
		townHalls: createTownHallLookup(townHalls),
	};
}

function createLookup<T extends Indexable>(items: readonly T[]): Lookup<T> {
	const idMap = indexBy(items, (item) => item.id);
	const clashIdMap = indexBy(items, (item) => item.clashId);
	return {
		byId: getter(idMap),
		byClashId: getter(clashIdMap),
		...namedLookup(items),
	};
}

function createHeroLookup(heroes: readonly Hero[]): HeroLookup {
	const clashIdMap = indexBy(heroes, (hero) => hero.clashId);
	return {
		byClashId: getter(clashIdMap),
		...namedLookup(heroes),
	};
}

function createTownHallLookup(townHalls: readonly TownHall[]): TownHallLookup {
	const levelMap = indexBy(townHalls, (th) => th.level);
	const levels = Array.from(levelMap.keys());
	return {
		byLevel: getter(levelMap),
		levels,
	};
}

/**
 * The parts of a lookup common to anything with a name.
 */
function namedLookup<T extends { name: string }>(items: readonly T[]): Pick<Lookup<T>, 'byName' | 'bySlug' | 'names' | 'slugs'> {
	const nameMap = indexBy(items, (item) => item.name);
	const slugMap = indexBy(items, (item) => encodeUnitName(item.name));
	const names = Array.from(nameMap.keys());
	const slugs = Array.from(slugMap.keys());
	return {
		byName: getter(nameMap),
		bySlug: getter(slugMap),
		names,
		slugs,
	};
}

/**
 * Maps each item by the key given.
 *
 * Keeps the first item where keys collide (NOTE: shouldn't really happen...).
 */
function indexBy<T, K>(items: readonly T[], getKey: (item: T) => K) {
	const map = new Map<K, T>();
	for (const item of items) {
		const key = getKey(item);
		if (!map.has(key)) {
			map.set(key, item);
		}
	}
	return map;
}

function getter<K, T>(map: Map<K, T>) {
	return (key: K) => {
		return map.get(key);
	};
}
