import type { Army, TownHall, Unit, ArmyUnit } from './types';

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

export const USER_MAX_ARMIES = 20;

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
				// Some events now let you
				return maxLevel;
			}
			return regularMaxLevel;
		}

		maxLevel = level;
	}

	return maxLevel;
}

/**
 * Ensures the armies units/capacity is valid for the town hall level
 */
export function validateArmy(army: Partial<Army>, ctx: { townHalls: TownHall[], units: Unit[] }) {
	const th = ctx.townHalls.find(t => t.level === army.townHall);
	if (!th) {
		throw new Error(`Expected to find data for town hall"${army.townHall}`)
	}

	if (!army.units) {
		throw new Error('Expected units');
	}

	// Check capacity is under max town hall capacity
	const totals = getTotals(army.units);
	if (totals.troops > th.troopCapacity) {
		throw new Error(`Town hall ${army.townHall} has a max troop capacity of ${th.troopCapacity}, but this army exceeded that with ${totals.troops}`);
	}
	if (totals.spells > th.spellCapacity) {
		throw new Error(`Town hall ${army.townHall} has a max spell capacity of ${th.spellCapacity}, but this army exceeded that with ${totals.spells}`);
	}
	if (totals.sieges > th.siegeCapacity) {
		throw new Error(`Town hall ${army.townHall} has a max siege machine capacity of ${th.siegeCapacity}, but this army exceeded that with ${totals.sieges}`);
	}

	const troopUnits = army.units.filter(item => item.type === 'Troop');

	// Check we haven't exceeded the super limit (max 2 unique super troops per army)
	const exceededSuperLimit = troopUnits.filter((t) => Boolean(ctx.units.find((x) => x.type === t.type && x.name === t.name)?.isSuper)).length > 2;
	if (exceededSuperLimit) {
		throw new Error(`An army can have a maximum of two unique super troops`)
	}

	// Check units can all be selected
	for (const unit of army.units) {
		const level = getUnitLevel(unit, { ...ctx, th });
		if (level === -1) {
			throw new Error(`Unit "${unit.name}" isn't available at town hall ${army.townHall}`);
		}
	}


	return army;
}
