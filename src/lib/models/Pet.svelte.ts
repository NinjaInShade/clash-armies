import type { HeroType, Pet, Optional, ArmyCtx } from '$types';
import { ArmyModel, type ArmyPet } from './Army.svelte';

export class PetModel {
	public ctx: ArmyCtx;

	/**
	 * Corresponding id in the army_pets table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public petId: number;
	public hero: HeroType;

	public info: Pet;

	constructor(ctx: ArmyCtx, data: Optional<ArmyPet, 'id'>) {
		this.ctx = ctx;

		this.id = data.id;
		this.petId = data.petId;
		this.hero = data.hero;

		this.info = PetModel.require(data.petId, this.ctx);
	}

	public getSaveData() {
		return {
			id: this.id,
			petId: this.petId,
			hero: this.hero,
		};
	}

	public static require(petId: number, ctx: ArmyCtx) {
		const pet = ctx.pets.find((p) => p.id === petId);
		if (!pet) {
			throw new Error(`Expected pet "${petId}"`);
		}
		return pet;
	}

	public static requireByName(name: string, ctx: ArmyCtx) {
		const pet = ctx.pets.find((p) => p.name === name);
		if (!pet) {
			throw new Error(`Expected pet "${name}"`);
		}
		return pet;
	}

	public static requireByClashID(clashId: number, ctx: ArmyCtx) {
		const pet = ctx.pets.find((p) => p.clashId === clashId);
		if (!pet) {
			throw new Error(`Expected pet "${clashId}"`);
		}
		return pet;
	}

	/**
	 * For the equipment given, this calculates the highest level the user has access to
	 * based on the user's pet house building level (which is based of the town hall selected)
	 *
	 * @returns highest available pet level or -1 if player hasn't unlocked it at all
	 */
	public static getMaxLevel(name: string, townHall: number, ctx: ArmyCtx) {
		const thData = ArmyModel.requireTownHall(townHall, ctx);
		const appPet = PetModel.requireByName(name, ctx);
		const prodLevel = thData.maxPetHouse;
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
}
