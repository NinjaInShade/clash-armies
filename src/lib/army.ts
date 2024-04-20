import type { TroopName, SiegeName, SpellName, AppState, Level } from './types';
import { SUPER_TO_REGULAR } from './constants';

/**
 * For the troop given, this calculates the highest level the user has access to
 * based on the users building levels (town hall, barracks, lab, etc...)
 *
 * @returns highest troop level or -1 if player hasn't unlocked it at all
 */
export function getTroopLevel(name: TroopName, app: AppState): Level {
	const troop = app.troops[name];
	if (!troop) throw new Error(`Expected to find troop "${name}"`);
	if (!app.townHall) return -1;

	let maxLevel = -1;

	// TODO: level should be type number?
	for (const [level, data] of Object.entries(troop)) {
		// get barrack level for the required production building
		let barrackLevel: number | null;
		if (data.productionBuilding === 'Barrack') {
			barrackLevel = app.barrack ?? -1;
		} else if (data.productionBuilding === 'Dark Elixir Barrack') {
			barrackLevel = app.darkBarrack ?? -1;
		} else {
			throw new Error(`Unrecognized production building "${data.productionBuilding}" for troop "${name}"`);
		}

		// Check if troop unlocked via barracks
		if (data.barrackLevel > barrackLevel) {
			return maxLevel;
		}

		// Check if level unlocked via laboratory (level 1 is available by default if troop is unlocked)
		const labLevel = app.laboratory ?? -1;
		if (+level !== 1 && data.laboratoryLevel > labLevel) {
			return maxLevel;
		}

		if (data.isSuper) {
			// Super troops are unlocked at town hall 11
			if (app.townHall < 11) {
				return maxLevel;
			}
			// If super troops unlocked, level matches the max level of the regular troop version
			const regularTroopVersion = SUPER_TO_REGULAR[name];
			if (!regularTroopVersion) {
				throw new Error(`Expected to find regular troop version for "${name}"`);
			}
			return getTroopLevel(regularTroopVersion, app);
		}

		maxLevel = +level;
	}

	return maxLevel;
}

/**
 * For the siege machine given, this calculates the highest level the user has access to
 * based on the users building levels (town hall, barracks, lab, etc...)
 *
 * @returns highest siege machine level or -1 if player hasn't unlocked it at all
 */
export function getSiegeLevel(name: SiegeName, app: AppState): Level {
	const siege = app.sieges[name];
	if (!siege) throw new Error(`Expected to find siege "${name}"`);
	if (!app.townHall) return -1;

	let maxLevel = -1;

	// Workshop is unlocked at town hall 12
	if (app.townHall < 12 || !app.workshop) {
		return -1;
	}

	// TODO: level should be type number?
	for (const [level, data] of Object.entries(siege)) {
		// check if siege unlocked via workshop
		if (data.barrackLevel > app.workshop) {
			return maxLevel;
		}

		// Check if level unlocked via laboratory (level 1 is available by default if siege is unlocked)
		const labLevel = app.laboratory ?? -1;
		if (+level !== 1 && data.laboratoryLevel > labLevel) {
			return maxLevel;
		}

		maxLevel = +level;
	}

	return maxLevel;
}

/**
 * For the spell given, this calculates the highest level the user has access to
 * based on the users building levels (town hall, barracks, lab, etc...)
 *
 * @returns highest spell level or -1 if player hasn't unlocked it at all
 */
export function getSpellLevel(name: SpellName, app: AppState): Level {
	const spell = app.spells[name];
	if (!spell) throw new Error(`Expected to find spell "${name}"`);
	if (!app.townHall) return -1;

	let maxLevel = -1;

	// Spell factory is unlocked at town hall 5
	if (app.townHall < 5) {
		return maxLevel;
	}

	// TODO: level should be type number?
	for (const [level, data] of Object.entries(spell)) {
		// get factory level for the required production building
		let spellFactoryLevel: number | null;
		if (data.productionBuilding === 'Spell Factory') {
			spellFactoryLevel = app.spellFactory ?? -1;
		} else if (data.productionBuilding === 'Dark Spell Factory') {
			spellFactoryLevel = app.darkSpellFactory ?? -1;
		} else {
			throw new Error(`Unrecognized production building "${data.productionBuilding}" for spell "${name}"`);
		}

		// Check if unlocked via spell factory
		if (data.spellFactoryLevel > spellFactoryLevel) {
			return maxLevel;
		}

		// Check if level unlocked via laboratory (level 1 is available by default if troop is unlocked)
		const labLevel = app.laboratory ?? -1;
		if (+level !== 1 && data.laboratoryLevel > labLevel) {
			return maxLevel;
		}

		maxLevel = +level;
	}

	return maxLevel;
}
