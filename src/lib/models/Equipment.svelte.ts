import type { Equipment, Optional, StaticGameData } from '$types';
import { ArmyModel, type ArmyEquipment } from './Army.svelte';

export class EquipmentModel {
	public gameData: StaticGameData;

	/**
	 * Corresponding id in the army_equipment table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public equipmentId: number;

	public info: Equipment;

	constructor(gameData: StaticGameData, data: Optional<ArmyEquipment, 'id'>) {
		this.gameData = gameData;

		this.id = data.id;
		this.equipmentId = data.equipmentId;

		this.info = EquipmentModel.require(data.equipmentId, this.gameData);
	}

	public getSaveData() {
		return {
			id: this.id,
			equipmentId: this.equipmentId,
		};
	}

	public static require(equipmentId: number, gameData: StaticGameData) {
		const eq = gameData.equipment.find((eq) => eq.id === equipmentId);
		if (!eq) {
			throw new Error(`Expected equipment "${equipmentId}"`);
		}
		return eq;
	}

	public static requireByName(name: string, gameData: StaticGameData) {
		const eq = gameData.equipment.find((p) => p.name === name);
		if (!eq) {
			throw new Error(`Expected equipment "${name}"`);
		}
		return eq;
	}

	public static requireByClashID(clashId: number, gameData: StaticGameData) {
		const eq = gameData.equipment.find((eq) => eq.clashId === clashId);
		if (!eq) {
			throw new Error(`Expected equipment "${clashId}"`);
		}
		return eq;
	}

	/**
	 * For the equipment given, this calculates the highest level the user has access to
	 * based on the user's blacksmith building level (which is based of the town hall selected)
	 *
	 * @returns highest available equipment level or -1 if player hasn't unlocked it at all
	 */
	public static getMaxLevel(name: string, townHall: number, gameData: StaticGameData) {
		const thData = ArmyModel.requireTownHall(townHall, gameData);
		const appEquipment = EquipmentModel.requireByName(name, gameData);
		if (ArmyModel.getMaxHeroLevel(appEquipment.hero, townHall, gameData) === -1) {
			// Check hero is unlocked
			return -1;
		}
		let maxLevel = -1;
		for (const levelData of appEquipment.levels) {
			if ((levelData.blacksmithLevel ?? -1) > (thData.maxBlacksmith ?? -1)) {
				return maxLevel;
			}
			maxLevel = levelData.level;
		}
		return maxLevel;
	}
}
