import type { UnitHome, Unit, Optional, ArmyCtx } from '$types';
import { ArmyModel, type ArmyUnit } from './Army.svelte';
import { SUPER_TO_REGULAR } from '$shared/utils';

export class UnitModel {
	public ctx: ArmyCtx;

	/**
	 * Corresponding id in the army_units table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public unitId: number;
	public home: UnitHome;
	public amount = $state(1);

	public info: Unit;

	constructor(ctx: ArmyCtx, data: Optional<ArmyUnit, 'id'>) {
		this.ctx = ctx;

		this.id = data.id;
		this.unitId = data.unitId;
		this.home = data.home;
		this.amount = data.amount;

		this.info = UnitModel.require(data.unitId, ctx);
	}

	public getSaveData() {
		return {
			id: this.id,
			unitId: this.unitId,
			home: this.home,
			amount: this.amount,
		};
	}

	public static require(unitId: number, ctx: ArmyCtx) {
		const unit = ctx.units.find((u) => u.id === unitId);
		if (!unit) {
			throw new Error(`Expected unit "${unitId}"`);
		}
		return unit;
	}

	public static requireTroopByName(name: string, ctx: ArmyCtx) {
		const unit = ctx.units.find((u) => (u.type === 'Troop' || u.type === 'Siege') && u.name === name);
		if (!unit) {
			throw new Error(`Expected troop "${name}"`);
		}
		return unit;
	}

	public static requireSpellByName(name: string, ctx: ArmyCtx) {
		const unit = ctx.units.find((u) => u.type === 'Spell' && u.name === name);
		if (!unit) {
			throw new Error(`Expected spell "${name}"`);
		}
		return unit;
	}

	public static requireTroopByClashID(clashId: number, ctx: ArmyCtx) {
		const unit = ctx.units.find((u) => (u.type === 'Troop' || u.type === 'Siege') && u.clashId === clashId);
		if (!unit) {
			throw new Error(`Expected troop "${clashId}"`);
		}
		return unit;
	}

	public static requireSpellByClashID(clashId: number, ctx: ArmyCtx) {
		const unit = ctx.units.find((u) => u.type === 'Spell' && u.clashId === clashId);
		if (!unit) {
			throw new Error(`Expected spell "${clashId}"`);
		}
		return unit;
	}

	/**
	 * Given the passed in units, calculates how much housing space has been used.
	 */
	public static getTotals(units: UnitModel[]) {
		return units.reduce(
			(prev, curr) => {
				const key = (curr.info.type.toLowerCase() + 's') as 'troops' | 'sieges' | 'spells';
				prev[key] += curr.info.housingSpace * curr.amount;
				return prev;
			},
			{ troops: 0, sieges: 0, spells: 0 }
		);
	}

	/**
	 * For the unit given, this calculates the highest level the user has access to
	 * based on the user's building levels (town hall, barracks, lab, etc...) and unit rules.
	 *
	 * @returns highest available unit level or -1 if player hasn't unlocked it at all
	 */
	public static getMaxLevel(unit: Unit, townHall: number, ctx: ArmyCtx): number {
		const thData = ArmyModel.requireTownHall(townHall, ctx);

		const { name, type } = unit;

		let maxLevel = -1;

		for (const levelData of unit.levels) {
			const { level } = levelData;

			if (type === 'Troop') {
				// Get the unit's production building level
				const prod = unit.productionBuilding;
				const prodLevel = prod === 'Barrack' ? (thData.maxBarracks ?? -1) : prod === 'Dark Elixir Barrack' ? (thData.maxDarkBarracks ?? -1) : null;
				if (prodLevel === null) {
					throw new Error(`Unrecognized production building "${unit.productionBuilding}" for troop "${name}"`);
				}
				// Check if troop unlocked via barracks
				if ((levelData.barrackLevel ?? -1) > prodLevel) {
					return maxLevel;
				}
			}

			if (type === 'Siege') {
				// Workshop is unlocked at town hall 12
				if (thData.level < 12 || !thData.maxWorkshop) {
					return -1;
				}
				// Check if siege unlocked via workshop
				if ((levelData.barrackLevel ?? -1) > thData.maxWorkshop) {
					return maxLevel;
				}
			}

			if (type === 'Spell') {
				// Spell factory is unlocked at town hall 5
				if (thData.level < 5) {
					return maxLevel;
				}
				// Get the unit's production building level
				const prod = unit.productionBuilding;
				const prodLevel = prod === 'Spell Factory' ? (thData.maxSpellFactory ?? -1) : prod === 'Dark Spell Factory' ? (thData.maxDarkSpellFactory ?? -1) : null;
				if (prodLevel === null) {
					throw new Error(`Unrecognized production building "${unit.productionBuilding}" for spell "${name}"`);
				}
				// Check if unlocked via spell factory
				if ((levelData.spellFactoryLevel ?? -1) > prodLevel) {
					return maxLevel;
				}
			}

			// Check if level unlocked via laboratory (level 1 is available by default if unit is unlocked)
			const labLevel = thData.maxLaboratory ?? -1;
			if (level !== 1 && (levelData.laboratoryLevel ?? -1) > labLevel) {
				return maxLevel;
			}

			if (type === 'Troop' && unit.isSuper) {
				// Super troops are unlocked at town hall 11
				if (thData.level < 11) {
					return maxLevel;
				}
				// If super troops unlocked, level matches the max level of the regular troop version
				const regularTroopVersion = ctx.units.find((x) => x.type === 'Troop' && x.name === SUPER_TO_REGULAR[name]);
				if (!regularTroopVersion) {
					throw new Error(`Expected to find regular troop version for "${name}"`);
				}
				const regularMaxLevel = UnitModel.getMaxLevel(regularTroopVersion, townHall, ctx);
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
	public static getMaxCcLevel(unit: Unit, townHall: number, ctx: ArmyCtx): number {
		const thData = ArmyModel.requireTownHall(townHall, ctx);

		const { name, type } = unit;

		if (thData.maxCc === null || (name === 'Battle Drill' && thData.maxCc < 9)) {
			return -1;
		}

		let maxLevel = -1;

		for (const levelData of unit.levels) {
			const { level } = levelData;

			// Check if level can be used based on the laboratory level cap
			const labLevel = thData.ccLaboratoryCap ?? -1;
			if (typeof levelData.laboratoryLevel === 'number' && levelData.laboratoryLevel > labLevel) {
				return maxLevel;
			}

			if (type === 'Troop' && unit.isSuper) {
				// Super troops are unlocked at town hall 11
				if (thData.level < 11) {
					return maxLevel;
				}
				// If super troops unlocked, level matches the max level allowed for the regular troop version
				const regularTroopVersion = ctx.units.find((x) => x.type === 'Troop' && x.name === SUPER_TO_REGULAR[name]);
				if (!regularTroopVersion) {
					throw new Error(`Expected to find regular troop version for "${name}"`);
				}

				// For super troop to be donated, the laboratory must be at least high enough for the regular troop to be boosted
				// See `getUnitLevel` for more info on how this check works
				const regularMaxLevel = UnitModel.getMaxLevel(regularTroopVersion, townHall, ctx);
				if (level > regularMaxLevel) return maxLevel;

				// If the laboratory is high enough to boost the regular troop,
				// use the max level of the regular troop in line with the `getCcUnitLevel` rules
				return UnitModel.getMaxCcLevel(regularTroopVersion, townHall, ctx);
			}

			maxLevel = level;
		}

		return maxLevel;
	}
}
