import type { Army, TownHall, Unit, ArmyUnit, Equipment, ArmyEquipment, Pet, ArmyPet, HeroType } from './types';

/**
 * A key:value of which regular troop corresponds to the super version.
 * This is required as some don't just have "Super" prefixed, e.g. "Rocket Balloon" -> "Balloon".
 */
export const SUPER_TO_REGULAR: Record<string, string> = {
	'Super Barbarian': 'Barbarian',
	'Super Archer': 'Archer',
	'Sneaky Goblin': 'Goblin',
	'Super Wall Breaker': 'Wall Breaker',
	'Super Giant': 'Giant',
	'Rocket Balloon': 'Balloon',
	'Super Wizard': 'Wizard',
	'Super Dragon': 'Dragon',
	'Inferno Dragon': 'Baby Dragon',
	'Super Minion': 'Minion',
	'Super Valkyrie': 'Valkyrie',
	'Super Witch': 'Witch',
	'Ice Hound': 'Lava Hound',
	'Super Bowler': 'Bowler',
	'Super Miner': 'Miner',
	'Super Hog Rider': 'Hog Rider'
};

/**
 * Used to prefix a group of clash of clans object IDs
 * e.g. 26 is the prefix for spells, used like: 26000000 (lightning spell)
 * Credit: https://github.com/clanner/cocdp/wiki/Object-Identifiers
 */
export const OBJECT_ID_PREFIXES = {
	Buildings: 1,
	Locales: 2,
	Resources: 3,
	Characters: 4,
	Animations: 5,
	Projectiles: 6,
	'Building Classes': 7,
	Obstacles: 8,
	Effects: 9,
	'Particle Emitters': 10,
	'Experience Levels': 11,
	Traps: 12,
	'Alliance Badges': 13,
	Globals: 14,
	'Townhall Levels': 15,
	'Alliance Portal': 16,
	Npcs: 17,
	Decos: 18,
	'Resource Packs': 19,
	Shields: 20,
	Missions: 21,
	'Billing Packages': 22,
	Achievements: 23,
	Credits: 24,
	Faq: 25,
	Spells: 26,
	Hints: 27,
	Heroes: 28,
	Leagues: 29,
	News: 30
} as const;

export const ARMY_EDIT_FILLER = 14;

export const HOLD_ADD_SPEED = 150;
export const HOLD_REMOVE_SPEED = 150;

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;

/**
 * Should match banner file names (without extension) in /static/clash/banners/*
 */
export const BANNERS = [
	'clan-capital-2',
	'clashiversary',
	'th-16',
	'books-of-clash',
	'chess',
	'clan-capital',
	'dark-ages-2',
	'dark-ages',
	'halloween',
	'lunar-new-year',
	'monument',
	'space',
	'summer',
	'valentines'
] as const;

export const USER_MAX_ARMIES = 40;

export const VALID_HEROES = ['Barbarian King', 'Archer Queen', 'Grand Warden', 'Royal Champion'] as const;

/**
 * Given the passed in units, calculates how much housing space
 * has been used and how long it will take to train the army.
 */
export function getTotals(units: ArmyUnit[]) {
	if (!units.length) {
		return { troops: 0, sieges: 0, spells: 0, time: 0 };
	}
	// These types can train at the same time.
	// The total time to train then is the max out of them all.
	const ParallelTimeCount = { troops: 0, spells: 0, sieges: 0 };
	return units.reduce(
		(prev, curr) => {
			const key = curr.type.toLowerCase() + 's' as keyof typeof ParallelTimeCount;
			ParallelTimeCount[key] += curr.trainingTime * curr.amount;
			prev[key] += curr.housingSpace * curr.amount;
			prev.time = Math.max(...Object.values(ParallelTimeCount));
			return prev;
		},
		{ troops: 0, sieges: 0, spells: 0, time: 0 }
	);
}

export function getCapacity(th: TownHall | undefined) {
	if (!th) {
		// Should never happen...
		return { troops: 0, spells: 0, sieges: 0 };
	}
	return { troops: th.troopCapacity, spells: th.spellCapacity, sieges: th.siegeCapacity };
}

export function getCcCapacity(th: TownHall | undefined) {
	if (!th) {
		// Should never happen...
		return { troops: 0, spells: 0, sieges: 0 };
	}
	return { troops: th.ccTroopCapacity, spells: th.ccSpellCapacity, sieges: th.ccSiegeCapacity };
}

export function hasHero(hero: HeroType, army: Army) {
	if (army.equipment.find((eq) => eq.hero === hero)) {
		return true;
	}
	if (army.pets.find((pet) => pet.hero === hero)) {
		return true;
	}
	return false;
}

/**
 * For the unit given, this calculates the highest level the user has access to
 * based on the user's building levels (town hall, barracks, lab, etc...) and unit rules.
 *
 * @returns highest available unit level or -1 if player hasn't unlocked it at all
 */
export function getUnitLevel(unit: Unit | ArmyUnit, ctx: { th: TownHall, units: Unit[] }): number {
	const { name, type } = unit;
	const appUnit = ctx.units.find(u => u.type === type && u.name === name);

	if (!appUnit) {
		throw new Error(`Expected to find unit "${name}"`)
	};
	if (!ctx.th) {
		return -1
	};

	let maxLevel = -1;

	for (const levelData of appUnit.levels) {
		const { level } = levelData;

		if (type === 'Troop') {
			// Get the unit's production building level
			const prod = appUnit.productionBuilding;
			const prodLevel = prod === 'Barrack' ? (ctx.th.maxBarracks ?? -1) : (prod === 'Dark Elixir Barrack' ? (ctx.th.maxDarkBarracks ?? -1) : null);
			if (prodLevel === null) {
				throw new Error(`Unrecognized production building "${appUnit.productionBuilding}" for troop "${name}"`);
			}
			// Check if troop unlocked via barracks
			if ((levelData.barrackLevel ?? -1) > prodLevel) {
				return maxLevel;
			}
		}

		if (type === 'Siege') {
			// Workshop is unlocked at town hall 12
			if (ctx.th.level < 12 || !ctx.th.maxWorkshop) {
				return -1;
			}
			// Check if siege unlocked via workshop
			if ((levelData.barrackLevel ?? -1) > ctx.th.maxWorkshop) {
				return maxLevel;
			}
		}

		if (type === 'Spell') {
			// Spell factory is unlocked at town hall 5
			if (ctx.th.level < 5) {
				return maxLevel;
			}
			// Get the unit's production building level
			const prod = appUnit.productionBuilding;
			const prodLevel = prod === 'Spell Factory' ? (ctx.th.maxSpellFactory ?? -1) : (prod === 'Dark Spell Factory' ? (ctx.th.maxDarkSpellFactory ?? -1) : null);
			if (prodLevel === null) {
				throw new Error(`Unrecognized production building "${appUnit.productionBuilding}" for spell "${name}"`);
			}
			// Check if unlocked via spell factory
			if ((levelData.spellFactoryLevel ?? -1) > prodLevel) {
				return maxLevel;
			}
		}

		// Check if level unlocked via laboratory (level 1 is available by default if unit is unlocked)
		const labLevel = ctx.th.maxLaboratory ?? -1;
		if (level !== 1 && (levelData.laboratoryLevel ?? -1) > labLevel) {
			return maxLevel;
		}

		if (type === 'Troop' && appUnit.isSuper) {
			// Super troops are unlocked at town hall 11
			if (ctx.th.level < 11) {
				return maxLevel;
			}
			// If super troops unlocked, level matches the max level of the regular troop version
			const regularTroopVersion = ctx.units.find(x => x.type === 'Troop' && x.name === SUPER_TO_REGULAR[name]);
			if (!regularTroopVersion) {
				throw new Error(`Expected to find regular troop version for "${name}"`)
			};
			const regularMaxLevel = getUnitLevel(regularTroopVersion, ctx);
			if (level > regularMaxLevel) {
				// Some super troop must have their regular troop unlocked to a certain level (e.g. super bowler requires level 4 bowler).
				// Therefore, some super troop levels start from the base regular troop level.
				return maxLevel;
			}
			return regularMaxLevel;
		}

		maxLevel = level;
	}

	return maxLevel;
}

/**
 * For the unit given, this calculates the highest level the user can have in their clan castle
 * based on the user's town hall, lab and unit rules.
 *
 * @returns highest available unit level or -1 if player doesn't have access to it at all
 */
export function getCcUnitLevel(unit: Unit | ArmyUnit, ctx: { th: TownHall, units: Unit[] }): number {
	const { name, type } = unit;
	const appUnit = ctx.units.find(u => u.type === type && u.name === name);

	if (!appUnit) {
		throw new Error(`Expected to find unit "${name}"`);
	}
	if (!ctx.th || ctx.th.maxCc === null || (unit.name === 'Battle Drill' && ctx.th.maxCc < 9)) {
		return -1;
	}

	let maxLevel = -1;

	for (const levelData of appUnit.levels) {
		const { level } = levelData;

		// Check if level can be used based on the laboratory level cap
		const labLevel = ctx.th.ccLaboratoryCap ?? -1;
		if (typeof levelData.laboratoryLevel === 'number' && levelData.laboratoryLevel > labLevel) {
			return maxLevel;
		}

		if (type === 'Troop' && appUnit.isSuper) {
			// Super troops are unlocked at town hall 11
			if (ctx.th.level < 11) {
				return maxLevel;
			}
			// If super troops unlocked, level matches the max level allowed for the regular troop version
			const regularTroopVersion = ctx.units.find(x => x.type === 'Troop' && x.name === SUPER_TO_REGULAR[name]);
			if (!regularTroopVersion) {
				throw new Error(`Expected to find regular troop version for "${name}"`)
			};

			// For super troop to be donated, the laboratory must be at least high enough for the regular troop to be boosted
			// See `getUnitLevel` for more info on how this check works
			const regularMaxLevel = getUnitLevel(regularTroopVersion, ctx);
			if (level > regularMaxLevel) return maxLevel;

			// If the laboratory is high enough to boost the regular troop,
			// use the max level of the regular troop in line with the `getCcUnitLevel` rules
			return getCcUnitLevel(regularTroopVersion, ctx);
		}

		maxLevel = level;
	}

	return maxLevel;
}

/**
 * For the equipment given, this calculates the highest level the user has access to
 * based on the user's blacksmith building level (which is based of the town hall selected)
 *
 * @returns highest available equipment level or -1 if player hasn't unlocked it at all
 */
export function getEquipmentLevel(equipment: Equipment | ArmyEquipment, ctx: { th: TownHall; equipment: Equipment[] }) {
	const { name } = equipment;
	const appEquipment = ctx.equipment.find((eq) => eq.name === name);
	if (!appEquipment) {
		throw new Error(`Expected to find equipment "${name}"`);
	}
	if (!ctx.th) {
		return -1;
	}


	if (getHeroLevel(appEquipment.hero, ctx) === -1) {
		// Check hero is unlocked
		return -1;
	}

	let maxLevel = -1;
	for (const levelData of appEquipment.levels) {
		if ((levelData.blacksmithLevel ?? -1) > (ctx.th.maxBlacksmith ?? -1)) {
			return maxLevel;
		}
		maxLevel = levelData.level;
	}
	return maxLevel;
}

/**
 * For the equipment given, this calculates the highest level the user has access to
 * based on the user's pet house building level (which is based of the town hall selected)
 *
 * @returns highest available pet level or -1 if player hasn't unlocked it at all
 */
export function getPetLevel(pet: Pet | ArmyPet, ctx: { th: TownHall; pets: Pet[] }) {
	const { name } = pet;
	const appPet = ctx.pets.find((p) => p.name === name);
	if (!appPet) {
		throw new Error(`Expected to find pet "${name}"`);
	}
	if (!ctx.th) {
		return -1;
	}
	const prodLevel = ctx.th.maxPetHouse;
	if (prodLevel === null) {
		// Pet house is not unlocked at this town hall
		return -1;
	}

	let maxLevel = -1;
	for (const levelData of appPet.levels) {
		if ((levelData.petHouseLevel ?? -1) > prodLevel) {
			return maxLevel;
		}
		maxLevel = levelData.level;
	}
	return maxLevel;
}

export function getHeroLevel(hero: HeroType, ctx: { th: TownHall }) {
	if (!VALID_HEROES.includes(hero)) {
		return -1;
	}
	if (hero === 'Barbarian King') {
		return ctx.th.maxBarbarianKing ?? -1;
	}
	if (hero === 'Archer Queen') {
		return ctx.th.maxArcherQueen ?? -1;
	}
	if (hero === 'Grand Warden') {
		return ctx.th.maxGrandWarden ?? -1;
	}
	if (hero === 'Royal Champion') {
		return ctx.th.maxRoyalChampion ?? -1;
	}
	// Should never happen?
	return -1;
}

export function getSuperTroopCount(units: ArmyUnit[], ctx: { units: Unit[] }) {
	const troopUnits = units.filter((x) => x.type === 'Troop');
	const superTroops = troopUnits.filter((troop) => {
		const appUnit = ctx.units.find((x) => x.type === troop.type && x.name === troop.name);
		return appUnit?.isSuper;
	});
	return superTroops.length;
}

function findDuplicateUnits(units: Unit[]) {
	const seen = new Set();
	const duplicates = new Set();
	for (const obj of units) {
		if (seen.has(obj.name)) {
			duplicates.add(obj.name);
		} else {
			seen.add(obj.name);
		}
	}
	return Array.from(duplicates);
}

/**
 * Ensures the armies units/capacity is valid for the town hall level
 */
export function validateArmy(army: Partial<Army>, ctx: { townHalls: TownHall[]; units: Unit[]; equipment: Equipment[]; pets: Pet[] }) {
	const th = ctx.townHalls.find((t) => t.level === army.townHall);
	if (!th) {
		throw new Error(`Expected to find data for town hall "${army.townHall}`);
	}

	if (!army.units) {
		throw new Error('Expected units');
	}

	const units = army.units.filter((unit) => unit.home === 'armyCamp');
	const ccUnits = army.units.filter((unit) => unit.home === 'clanCastle');
	const equipment = army.equipment ?? [];
	const pets = army.pets ?? [];

	// Check for duplicate units
	const duplicateUnits = findDuplicateUnits(units);
	if (duplicateUnits.length) {
		throw new Error(`Duplicate unit "${duplicateUnits[0]}" found`);
	}
	// Check for duplicate cc units
	const duplicateCcUnits = findDuplicateUnits(ccUnits);
	if (duplicateCcUnits.length) {
		throw new Error(`Duplicate clan castle unit "${duplicateCcUnits[0]}" found`);
	}

	// Check totals don't overflow max town hall capacity
	const totals = getTotals(units);
	if (totals.troops > th.troopCapacity) {
		throw new Error(`Town hall ${th.level} has a max troop capacity of ${th.troopCapacity}, but this army exceeded that with ${totals.troops}`);
	}
	if (totals.spells > th.spellCapacity) {
		throw new Error(`Town hall ${th.level} has a max spell capacity of ${th.spellCapacity}, but this army exceeded that with ${totals.spells}`);
	}
	if (totals.sieges > th.siegeCapacity) {
		throw new Error(`Town hall ${th.level} has a max siege machine capacity of ${th.siegeCapacity}, but this army exceeded that with ${totals.sieges}`);
	}
	// Check cc totals don't overflow max town hall cc capacity
	const ccTotals = getTotals(ccUnits);
	if (ccTotals.troops > th.ccTroopCapacity) {
		throw new Error(`Town hall ${th.level} has a max clan castle troop capacity of ${th.ccTroopCapacity}, but this army exceeded that with ${ccTotals.troops}`);
	}
	if (ccTotals.spells > th.ccSpellCapacity) {
		throw new Error(`Town hall ${th.level} has a max clan castle spell capacity of ${th.ccSpellCapacity}, but this army exceeded that with ${ccTotals.spells}`);
	}
	if (ccTotals.sieges > th.ccSiegeCapacity) {
		throw new Error(`Town hall ${th.level} has a max clan castle siege machine capacity of ${th.ccSiegeCapacity}, but this army exceeded that with ${ccTotals.sieges}`);
	}

	// Check we haven't exceeded the super limit (max 2 unique super troops per army)
	if (getSuperTroopCount(units, ctx) > 2) {
		throw new Error(`An army can have a maximum of two unique super troops`);
	}

	// Check units can all be selected
	for (const unit of units) {
		if (getUnitLevel(unit, { ...ctx, th }) === -1) {
			throw new Error(`Unit "${unit.name}" isn't available at town hall ${army.townHall}`);
		}
	}
	// Check cc units can all be selected
	for (const unit of ccUnits) {
		if (getCcUnitLevel(unit, { ...ctx, th }) === -1) {
			throw new Error(`Clan castle unit "${unit.name}" isn't available at town hall ${army.townHall}`);
		}
	}

	const heroToEquipment: Record<string, string[]> = {};
	for (const eq of equipment) {
		const hero = eq.hero.toLowerCase();
		const stashedEquipment = heroToEquipment[eq.hero] ?? [];
		const appEq = ctx.equipment.find((e) => e.name === eq.name);
		if (!appEq) {
			throw new Error(`Couldn't find equipment "${eq.name}"`);
		}
		if (eq.hero !== appEq.hero) {
			throw new Error(`Equipment "${eq.name}" cannot be equipped on the ${hero}`);
		}
		if (stashedEquipment.includes(eq.name)) {
			throw new Error(`Duplicate equipment "${eq.name}" on ${hero}`);
		}
		if (stashedEquipment.length === 2) {
			throw new Error(`Hero ${hero} cannot have more than two pieces of equipment`);
		}
		if (getHeroLevel(eq.hero, { th }) === -1) {
			throw new Error(`Equipment "${eq.name}" can't be used as the ${hero} isn't unlocked at town hall ${army.townHall}`);
		}
		if (getEquipmentLevel(eq, { ...ctx, th }) === -1) {
			throw new Error(`Equipment "${eq.name}" isn't available at town hall ${army.townHall}`);
		}
		heroToEquipment[eq.hero] = [...stashedEquipment, eq.name];
	}

	const heroToPets: Record<string, string[]> = {};
	for (const pet of pets) {
		const hero = pet.hero.toLowerCase();
		const stashedPets = heroToPets[pet.hero] ?? [];
		if (stashedPets.length === 1) {
			throw new Error(`Hero ${hero} cannot have more than one pet`);
		}
		if (
			Object.values(heroToPets)
				.flatMap((p) => p)
				.includes(pet.name)
		) {
			throw new Error(`Pet "${pet.name}" has already been assigned to another hero`);
		}
		if (getHeroLevel(pet.hero, { th }) === -1) {
			throw new Error(`Pet "${pet.name}" can't be used as the ${hero} isn't unlocked at town hall ${army.townHall}`);
		}
		if (getPetLevel(pet, { ...ctx, th }) === -1) {
			throw new Error(`Pet "${pet.name}" isn't available at town hall ${army.townHall}`);
		}
		heroToPets[pet.hero] = [...stashedPets, pet.name];
	}

	return army;
}
