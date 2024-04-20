import type { MySQL } from '@ninjalib/sql';

// After first deploy, updating these files won't work.
// Instead, use the admin interface to add new units/townhalls
import BuildingsSeedData from "./buildings.json";
import troopsSeedData from "./troops.json";
import SpellsSeedData from "./spells.json";
import ObjectIdsSeedData from "./object-ids.json";

// The static JSON file has *every* troop/siege/spell, including
// seasonal/deprecated ones, so we have to filter those out somehow
export const CURRENT_TROOPS: string[] = [
	'Apprentice Warden',
	'Archer',
	'Baby Dragon',
	'Balloon',
	'Barbarian',
	'Bowler',
	'Dragon Rider',
	'Dragon',
	'Electro Dragon',
	'Electro Titan',
	'Giant',
	'Goblin',
	'Golem',
	'Headhunter',
	'Healer',
	'Hog Rider',
	'Ice Golem',
	'Ice Hound',
	'Inferno Dragon',
	'Lava Hound',
	'Miner',
	'Minion',
	'P.E.K.K.A',
	'Rocket Balloon',
	'Root Rider',
	'Sneaky Goblin',
	'Super Archer',
	'Super Barbarian',
	'Super Bowler',
	'Super Dragon',
	'Super Giant',
	'Super Hog Rider',
	'Super Miner',
	'Super Minion',
	'Super Valkyrie',
	'Super Wall Breaker',
	'Super Witch',
	'Super Wizard',
	'Valkyrie',
	'Wall Breaker',
	'Witch',
	'Wizard',
	'Yeti'
];
export const CURRENT_SIEGES: string[] = [
    'Wall Wrecker',
    'Battle Blimp',
    'Stone Slammer',
    'Siege Barracks',
    'Log Launcher',
    'Flame Flinger',
    'Battle Drill'
];
const CURRENT_SPELLS: string[] = [
    'Lightning',
    'Healing',
    'Rage',
    'Jump',
    'Freeze',
    'Clone',
    'Invisibility',
    'Recall',
    'Poison',
    'Earthquake',
    'Haste',
    'Skeleton',
    'Bat'
];

/**
 * The troop names in static/clash/troops/troops.json don't
 * all correspond to the ones in static/objectIds.json so
 * we have to map the translations. TODO: investigate potentially better options
 */
const NAME_TO_OBJECT_ID_NAME: Record<string, string> = {
    'P.E.K.K.A': 'PEKKA',
    Minion: 'Gargoyle',
    Valkyrie: 'Warrior Girl',
    Witch: 'Warlock',
    'Lava Hound': 'AirDefenceSeeker',
    'Baby Dragon': 'BabyDragon',
    'Super Barbarian': 'EliteBarbarian',
    'Super Archer': 'EliteArcher',
    'Super Wall Breaker': 'EliteWallBreaker',
    'Super Valkyrie': 'EliteValkyrie',
    'Super Giant': 'EliteGiant',
    'Wall Wrecker': 'Siege Machine Ram',
    'Battle Blimp': 'Siege Machine Flyer',
    'Sneaky Goblin': 'EliteGoblin',
    'Rocket Balloon': 'HastyBalloon',
    'Stone Slammer': 'Siege Bowler Balloon',
    'Inferno Dragon': 'InfernoDragon',
    'Super Witch': 'Head Witch',
    'Siege Barracks': 'Siege Machine Carrier',
    'Log Launcher': 'Siege Log Launcher',
    'Flame Flinger': 'Siege Catapult',
    'Lightning Spell': 'LighningStorm',
    'Healing Spell': 'HealingWave',
    'Rage Spell': 'Haste',
    'Jump Spell': 'Jump',
    'Freeze Spell': 'Freeze',
    'Poison Spell': 'Poison',
    'Earthquake Spell': 'Earthquake',
    'Haste Spell': 'SpeedUp',
    'Clone Spell': 'Duplicate',
    'Skeleton Spell': 'SpawnSkele',
    'Bat Spell': 'SpawnBats',
    'Invisibility Spell': 'Invisibility',
    'Recall Spell': 'Recall',
    'Hog Rider': 'Boar Rider'
};

type BuildingName = 'Town Hall' | 'Barracks' | 'Dark Barracks' | 'Laboratory' | 'Spell Factory' | 'Dark Spell Factory' | 'Workshop';

export async function insertInitialTownHalls(db: MySQL) {
    const levels = Object.keys(BuildingsSeedData['Town Hall']).map(lvl => +lvl);
    const townHallData = levels.map(populateTownHallLevel)
    await db.insertMany('town_halls', townHallData);
}

export async function insertInitialUnits(db: MySQL) {
    // Insert troops & siege machines
    for (const [name, levels] of Object.entries(troopsSeedData)) {
        const isTroop = CURRENT_TROOPS.includes(name);
		const isSiege = CURRENT_SIEGES.includes(name);
		if (!isTroop && !isSiege) {
			continue;
		}

        // Global attributes are duplicated on every level data, so we can just grab them from any level data index
        const ids = swapKeysAndValues(ObjectIdsSeedData);
        const unitId = await db.insertOne('units', {
            type: isTroop ? 'Troop' : 'Siege',
            name,
            objectId: ids[NAME_TO_OBJECT_ID_NAME[name] ?? name],
            housingSpace: levels[1].HousingSpace,
            trainingTime: levels[1].TrainingTime,
            productionBuilding: levels[1].ProductionBuilding,
            isSuper: levels[1].EnabledBySuperLicence ?? false,
            isFlying: levels[1].IsFlying ?? false,
            isJumper: levels[1].IsJumper ?? false,
            airTargets: levels[1].AirTargets ?? false,
            groundTargets: levels[1].GroundTargets ?? false,
        })

        // Insert levels
        const unitLevels = Object.entries(levels).map(([level, data]) => {
        	const { BarrackLevel, LaboratoryLevel, HousingSpace, TrainingTime, ProductionBuilding, EnabledBySuperLicence = false } = data;
			if (typeof BarrackLevel !== 'number' || typeof LaboratoryLevel !== 'number' || typeof HousingSpace !== 'number' || typeof TrainingTime !== 'number') {
				throw new Error('Expected number value from static JSON');
			}
			if (ProductionBuilding !== 'Barrack' && ProductionBuilding !== 'Dark Elixir Barrack' && ProductionBuilding !== 'Siege Workshop') {
				throw new Error(`Expected valid production building, got "${ProductionBuilding}" for troop "${name}"`);
			}
			if (typeof EnabledBySuperLicence !== 'boolean') {
				throw new Error(`Can't determine if troop "${name}" is super or not`);
			}
            return {
                unitId,
                level: +level,
                barrackLevel: BarrackLevel,
                laboratoryLevel: LaboratoryLevel,
            }
        })
        await db.insertMany('unit_levels', unitLevels);
    }

    // Insert spells
    for (const [name, levels] of Object.entries(SpellsSeedData)) {
        const truncatedName = name.replace(' Spell', '');
        if (!CURRENT_SPELLS.includes(truncatedName)) {
            continue;
        }

        // Global attributes are duplicated on every level data, so we can just grab them from any level data index
        const ids = swapKeysAndValues(ObjectIdsSeedData);
        const unitId = await db.insertOne('units', {
            type: 'Spell',
            name: truncatedName,
            objectId: ids[NAME_TO_OBJECT_ID_NAME[name] ?? name],
            housingSpace: levels[1].HousingSpace,
            trainingTime: levels[1].TrainingTime,
            productionBuilding: levels[1].ProductionBuilding
        })

        // Insert levels
        const unitLevels = Object.entries(levels).map(([level, data]) => {
            const { SpellForgeLevel, LaboratoryLevel, HousingSpace, TrainingTime, ProductionBuilding } = data;
            if (typeof SpellForgeLevel !== 'number' || typeof LaboratoryLevel !== 'number' || typeof HousingSpace !== 'number' || typeof TrainingTime !== 'number') {
                throw new Error('Expected number value for static JSON');
            }
            if (ProductionBuilding !== 'Spell Factory' && ProductionBuilding !== 'Dark Spell Factory') {
                throw new Error(`Expected valid production building, got "${ProductionBuilding}"  for spell "${name}"`);
            }
            return {
                unitId,
                level: +level,
                spellFactoryLevel: SpellForgeLevel,
                laboratoryLevel: LaboratoryLevel,
            }
        })
        await db.insertMany('unit_levels', unitLevels);
    }
}

function swapKeysAndValues(obj: Record<string, string>) {
	return Object.entries(obj).reduce<Record<string, string>>((prev, [id, name]) => {
		prev[name] = id;
		return prev;
	}, {});
}

function populateTownHallLevel(thLevel: number) {
    /**
     * Static data does not include enough information to infer this
     * TODO: try to fix this (maybe just modify static data directly)
     */
    const TROOP_CAPACITY_BY_TH: Record<number, number> = {
        1: 20,
        2: 30,
        3: 70,
        4: 80,
        5: 135,
        6: 150,
        7: 200,
        8: 200,
        9: 220,
        10: 240,
        11: 260,
        12: 280,
        13: 300,
        14: 300,
        15: 320,
        16: 320
    };

    /** Finds the max level building that is unlocked for the current town hall being looped */
    const findMaxLevel = (name: BuildingName) => {
        let maxLevelBuilding: Record<string, string | number | boolean | undefined> = {};
        for (const level of Object.values(BuildingsSeedData[name])) {
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

    const spellFactory = findMaxLevel('Spell Factory');
    const darkSpellFactory = findMaxLevel('Dark Spell Factory');
    const workshop = findMaxLevel('Workshop');

    const spellHousing = spellFactory.HousingSpaceAlt;
    const darkSpellHousing = darkSpellFactory.HousingSpaceAlt;
    if ((spellHousing !== undefined && typeof spellHousing !== 'number') || (darkSpellHousing !== undefined && typeof darkSpellHousing !== 'number')) {
        throw new Error('Expected spell factory housing space to be a number');
    }

    return {
        level: thLevel,
        maxBarracks: findMaxLevel('Barracks').BuildingLevel ?? null,
        maxDarkBarracks: findMaxLevel('Dark Barracks').BuildingLevel ?? null,
        maxLaboratory: findMaxLevel('Laboratory')?.BuildingLevel ?? null,
        maxSpellFactory: spellFactory.BuildingLevel ?? null,
        maxDarkSpellFactory: darkSpellFactory.BuildingLevel ?? null,
        maxWorkshop: workshop.BuildingLevel ?? null,
        /** Note: this will be wrong if more than one siege machine was allowed in an army */
        troopCapacity: TROOP_CAPACITY_BY_TH[thLevel],
        siegeCapacity: workshop.BuildingLevel ? 1 : 0,
        spellCapacity: (spellHousing ?? 0) + (darkSpellHousing ?? 0),
    }
}
