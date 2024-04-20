// TODO: see if these "CURRENT_" constants can be removed? Can we just infer what troops are active?
// The static JSON file has *every* troop/siege/spell, including seasonal/deprecated ones, so we have to filter those out somehow
export const CURRENT_TROOPS = [
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
] as const;
export const CURRENT_SIEGES = ['Wall Wrecker', 'Battle Blimp', 'Stone Slammer', 'Siege Barracks', 'Log Launcher', 'Flame Flinger', 'Battle Drill'] as const;
export const CURRENT_SPELLS = [
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
] as const;

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

/**
 * The troop names in static/clash/troops/troops.json don't
 * all correspond to the ones in static/objectIds.json so
 * we have to map the translations. TODO: investigate potentially better options
 */
export const NAME_TO_OBJECT_ID_NAME = {
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
} as const;

export const ARMY_CREATE_TROOP_FILLER = 20;
export const ARMY_CREATE_SPELL_FILLER = 10;
