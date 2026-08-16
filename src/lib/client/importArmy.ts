import { ArmyModel } from '$models/Army.svelte';
import { EquipmentModel } from '$models/Equipment.svelte';
import { PetModel } from '$models/Pet.svelte';
import { UnitModel } from '$models/Unit.svelte';
import { validateArmy } from '$shared/validation';
import type { StaticGameData, UnitHome } from '$types';

/*
 * Kept separate from `$client/army` on purpose:
 *
 * `validateArmy` pulls in zod (~100KB gzipped), and `$client/army` is imported by many places, notably
 * `ArmyCard`, so bundling the two together ships extra cost to every page listing armies for example.
 *
 * Importing from a link only happens when creating/editing an army, so this is a separate module scoped
 * only to those purposes.
 */

const ARMY_LINK_SEPARATOR = /h(?<heroes>[^idus]+)|i(?<castle_units>[\d+x-]+)|d(?<castle_spells>[\d+x-]+)|u(?<units>[\d+x-]+)|s(?<spells>[\d+x-]+)/gm;
const ARMY_LINK_HERO_PATTERN = /(?<hero_id>\d+)(?:m\d+)?(?:p(?<pet_id>\d+))?(?:e(?<eq1>\d+)(?:_(?<eq2>\d+))?)?/gm;

/**
 * Takes in a clash of clans army link and parses it into clash army units/ccUnits/heroes data.
 */
export function parseLink(fullLink: string, gameData: StaticGameData) {
	const url = new URL(fullLink);
	const link = url.searchParams.get('army');
	if (!link) {
		throw new Error(`Import link "${fullLink}" is invalid`);
	}

	const model = new ArmyModel(gameData);

	function parseUnits(data: string) {
		return data
			.split('-')
			.filter(Boolean)
			.map((item) => {
				const [amount, id] = item.split('x').map(Number);
				return { id, amount };
			});
	}

	function addUnit(data: { id: number; amount: number }, type: 'Troop' | 'Spell', housedIn: UnitHome) {
		if (type === 'Troop') {
			const unit = UnitModel.requireTroopByClashID(data.id, gameData);
			const modelUnit = model.addUnit(unit, housedIn);
			modelUnit.amount = data.amount;
		} else if (type === 'Spell') {
			const unit = UnitModel.requireSpellByClashID(data.id, gameData);
			const modelUnit = model.addUnit(unit, housedIn);
			modelUnit.amount = data.amount;
		}
	}

	for (const match of link.matchAll(ARMY_LINK_SEPARATOR)) {
		if (match.groups?.heroes) {
			for (const hero of match.groups.heroes.split('-').filter(Boolean)) {
				const m = ARMY_LINK_HERO_PATTERN.exec(hero);
				const groups = m?.groups;
				if (groups) {
					const heroName = model.gameData.heroes.find((hero) => hero.clashId === +groups.hero_id)?.name;
					if (!heroName) {
						throw new Error('Invalid hero ID');
					}
					if (groups.pet_id) {
						const pet = PetModel.requireByClashID(parseInt(groups.pet_id, 10), gameData);
						model.addPet(pet, heroName);
					}
					if (groups.eq1) {
						const eq = EquipmentModel.requireByClashID(parseInt(groups.eq1, 10), gameData);
						if (eq.hero !== heroName) {
							throw new Error(`Hero mismatch "${eq.hero}" and "${heroName}"`);
						}
						model.addEquipment(eq);
					}
					if (groups.eq2) {
						const eq = EquipmentModel.requireByClashID(parseInt(groups.eq2, 10), gameData);
						if (eq.hero !== heroName) {
							throw new Error(`Hero mismatch "${eq.hero}" and "${heroName}"`);
						}
						model.addEquipment(eq);
					}
				}
				// Reset lastIndex of regex otherwise you get random `null` results from the `exec`.
				ARMY_LINK_HERO_PATTERN.lastIndex = 0;
			}
		} else if (match.groups?.castle_units) {
			parseUnits(match.groups.castle_units).forEach((unit) => addUnit(unit, 'Troop', 'clanCastle'));
		} else if (match.groups?.castle_spells) {
			parseUnits(match.groups.castle_spells).forEach((unit) => addUnit(unit, 'Spell', 'clanCastle'));
		} else if (match.groups?.units) {
			parseUnits(match.groups.units).forEach((unit) => addUnit(unit, 'Troop', 'armyCamp'));
		} else if (match.groups?.spells) {
			parseUnits(match.groups.spells).forEach((unit) => addUnit(unit, 'Spell', 'armyCamp'));
		}
	}

	// TODO: support multiple CCs in armies
	const firstSiege = model.units.find((u) => u.info.type === 'Siege');
	if (firstSiege) {
		model.units = model.units.filter((u) => u.info.type !== 'Siege' || u === firstSiege);
		firstSiege.amount = 1;
	}

	// Ensure imported data is valid
	const modelData = model.getSaveData();

	// TODO: validateArmy() validates *everything* whereas here we only care
	// about certain things like units, so we end up having to "stub" some properties
	modelData.name = 'stub';

	validateArmy(modelData, gameData);

	return model;
}
