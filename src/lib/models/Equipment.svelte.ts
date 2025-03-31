import type { Equipment, Optional, ArmyCtx } from '$types';
import { ArmyModel, type ArmyEquipment } from './Army.svelte';

export class EquipmentModel {
	public ctx: ArmyCtx;

	/**
	 * Corresponding id in the army_equipment table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public equipmentId: number;

	public info: Equipment;

	constructor(ctx: ArmyCtx, data: Optional<ArmyEquipment, 'id'>) {
		this.ctx = ctx;

		this.id = data.id;
		this.equipmentId = data.equipmentId;

		this.info = EquipmentModel.require(data.equipmentId, this.ctx);
	}

	public getSaveData() {
		return {
			id: this.id,
			equipmentId: this.equipmentId,
		};
	}

	public static require(equipmentId: number, ctx: ArmyCtx) {
		const eq = ctx.equipment.find((eq) => eq.id === equipmentId);
		if (!eq) {
			throw new Error(`Expected equipment "${equipmentId}"`);
		}
		return eq;
	}

	public static requireByName(name: string, ctx: ArmyCtx) {
		const eq = ctx.equipment.find((p) => p.name === name);
		if (!eq) {
			throw new Error(`Expected equipment "${name}"`);
		}
		return eq;
	}

	public static requireByClashID(clashId: number, ctx: ArmyCtx) {
		const eq = ctx.equipment.find((eq) => eq.clashId === clashId);
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
	public static getMaxLevel(name: string, townHall: number, ctx: ArmyCtx) {
		const thData = ArmyModel.requireTownHall(townHall, ctx);
		const appEquipment = EquipmentModel.requireByName(name, ctx);
		if (ArmyModel.getMaxHeroLevel(appEquipment.hero, townHall, ctx) === -1) {
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
