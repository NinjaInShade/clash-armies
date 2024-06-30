import type { Army, Unit, ArmyUnit, AppState } from '~/lib/shared/types';
import { SECOND, MINUTE, HOUR, SUPER_TO_REGULAR, OBJECT_ID_PREFIXES } from '~/lib/shared/utils';

/**
 * Given the passed in army, calculates how much housing space
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
export function getUnitLevel(unit: Unit | ArmyUnit, app: AppState) {
	const { name, type } = unit;
	const appUnit = app.units.find(u => u.type === type && u.name === name);

	if (!appUnit) {
		throw new Error(`Expected to find unit "${name}"`)
	};
	if (!app.townHall) {
		return -1
	};

	let maxLevel = -1;

	for (const levelData of appUnit.levels) {
		const { level } = levelData;

		if (type === 'Troop') {
			// Get the unit's production building level
			const prod = appUnit.productionBuilding;
			const prodLevel = prod === 'Barrack' ? (app.barrack ?? -1) : (prod === 'Dark Elixir Barrack' ? (app.darkBarrack ?? -1) : null);
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
			if (app.townHall < 12 || !app.workshop) {
				return -1;
			}
			// Check if siege unlocked via workshop
			if ((levelData.barrackLevel ?? -1) > app.workshop) {
				return maxLevel;
			}
		}

		if (type === 'Spell') {
			// Spell factory is unlocked at town hall 5
			if (app.townHall < 5) {
				return maxLevel;
			}
			// Get the unit's production building level
			const prod = appUnit.productionBuilding;
			const prodLevel = prod === 'Spell Factory' ? (app.spellFactory ?? -1) : (prod === 'Dark Spell Factory' ? (app.darkSpellFactory ?? -1) : null);
			if (prodLevel === null) {
				throw new Error(`Unrecognized production building "${appUnit.productionBuilding}" for spell "${name}"`);
			}
			// Check if unlocked via spell factory
			if ((levelData.spellFactoryLevel ?? -1) > prodLevel) {
				return maxLevel;
			}
		}

		// Check if level unlocked via laboratory (level 1 is available by default if unit is unlocked)
		const labLevel = app.laboratory ?? -1;
		if (level !== 1 && (levelData.laboratoryLevel ?? -1) > labLevel) {
			return maxLevel;
		}

		if (type === 'Troop' && appUnit.isSuper) {
			// Super troops are unlocked at town hall 11
			if (app.townHall < 11) {
				return maxLevel;
			}
			// If super troops unlocked, level matches the max level of the regular troop version
			const regularTroopVersion = app.units.find(x => x.type === 'Troop' && x.name === SUPER_TO_REGULAR[name]);
			if (!regularTroopVersion) {
				throw new Error(`Expected to find regular troop version for "${name}"`)
			};
			return getUnitLevel(regularTroopVersion, app);
		}

		maxLevel = level;
	}

	return maxLevel;
}

/**
 * Generates URL link to copy army into clash of clans.
 *
 * Example: https://link.clashofclans.com/en?action=CopyArmy&army=u10x0-2x3s1x9-3x2
 *
 * First are troops, prefixed with the "u" character):
 * - First item is 10 troops with id 0, which are Barbarians.
 * - Next item is 2 troops with id 3, which are Giants.
 *
 * Then come the spells (starting with the s character):
 * - First is 1 spell with id 9, which is a Poison Spell.
 * - Second is 3 spells with id 2, which is a Rage Spell.
 */
export function generateLink(units: ArmyUnit[]): string {
	let url = 'https://link.clashofclans.com/?action=CopyArmy&army=';

	const selectedTroops = units.filter((item) => item.type === 'Troop' || item.type === 'Siege');
	const selectedSpells = units.filter((item) => item.type === 'Spell');

	// generate troops
	if (selectedTroops.length) {
		url += 'u';
		url += selectedTroops
			.reduce<string[]>((prev, troop) => {
				troop.objectId
				const id = String(troop.objectId).slice(String(OBJECT_ID_PREFIXES.Characters).length);
				const troopString = `${troop.amount}x${+id}`;
				prev.push(troopString);
				return prev;
			}, [])
			.join('-');
	}

	// generate spells
	if (selectedSpells.length) {
		url += 's';
		url += selectedSpells
			.reduce<string[]>((prev, spell) => {
				const id = String(spell.objectId).slice(String(OBJECT_ID_PREFIXES.Spells).length);
				const spellString = `${spell.amount}x${+id}`;
				prev.push(spellString);
				return prev;
			}, [])
			.join('-');
	}

	return url;
}

/**
 * Takes in a clash of clans army link and parses it into an array of selected items
 *
 * The army=querystring value can be parsed with regex into two groups (troops and spells):
 * - u([\d+x-]+)s([\d+x-]+)
 */
export function parseLink(link: string): ArmyUnit[] {
	// TODO: implement when adding "Load from link" input
}

export function openLink(href: string, openInNewTab = true) {
	window.open(href, openInNewTab ? '_blank' : undefined, 'rel="noreferrer"');
}

export async function copyLink(units: ArmyUnit[]) {
	const link = generateLink(units);
	await navigator.clipboard.writeText(link);
	alert(`Successfully copied "${link}" to clipboard!`); // TODO: change to a toast notification
}

export function openInGame(units: ArmyUnit[]) {
	const link = generateLink(units);
	openLink(link);
}

export function getTags(army: Army) {
	const tags: string[] = [];
	tags.push(`TH${army.townHall}`);
	const typeData = army.units.reduce(
		(prev, curr) => {
			if (curr.type === 'Spell') {
				return prev;
			}
			if (curr.isFlying) {
				prev.air += curr.amount;
			} else {
				prev.ground += curr.amount;
			}
			return prev;
		},
		{ air: 0, ground: 0 }
	);
	tags.push(typeData.ground > typeData.air ? 'Ground' : 'Air');
	if (army.guideId) {
		//  TODO: guide system
		tags.push(`Has guide`);
	}
	return tags;
}

/**
 * @param time: the time to format in miliseconds
 * @returns formatted time string e.g. '1m 20s'
 */
export function formatTime(time: number) {
	const parts: string[] = [];

	if (time >= HOUR) {
		const hours = Math.floor(time / HOUR);
		parts.push(`${hours}h`);
		time -= hours * HOUR;
	}
	if (time >= MINUTE) {
		const mins = Math.floor(time / MINUTE);
		parts.push(`${mins}m`);
		time -= mins * MINUTE;
	}
	if (time >= SECOND) {
		const secs = Math.floor(time / SECOND);
		parts.push(`${secs}s`);
		time -= secs * SECOND;
	}
	if (time > 0) {
		throw new Error(`Unexpected time left over after formatting: "${time}"`);
	}

	return parts.length ? parts.join(' ') : '0s';
}

export function getCopyBtnTitle(units: ArmyUnit[]) {
	if (units.length) {
		return "Copies an army link to your clipboard for sharing.\nNote: may not work in game if the army isn't at full capacity";
	}
	return 'Army cannot be shared when empty';
}

export function getOpenBtnTitle(units: ArmyUnit[]) {
	if (units.length) {
		return "Opens clash of clans and allows you to paste your army in one of your slots.\nNote: may not work in game if the army isn't at full capacity";
	}
	return 'Army cannot be opened in-game when empty';
}
