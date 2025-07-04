import type { Unit, UnitHome, HeroType, Banner, StaticGameData, Pet, Equipment } from '$types';
import { BANNERS, VALID_HEROES } from '$shared/utils';
import { UnitModel } from './Unit.svelte';
import { PetModel } from './Pet.svelte';
import { EquipmentModel } from './Equipment.svelte';
import { GuideModel } from './Guide.svelte';
import { CommentModel } from './Comment.svelte';

export type Army = {
	id: number;
	score: number;
	pageViews: number;
	openLinkClicks: number;
	copyLinkClicks: number;
	name: string;
	townHall: number;
	guide: ArmyGuide | null;
	units: ArmyUnit[];
	pets: ArmyPet[];
	equipment: ArmyEquipment[];
	banner: Banner;
	/**
	 * User-selected army tags.
	 * These get merged with the auto-generated tags in `getTags`
	 */
	tags: string[];
	comments: ArmyComment[];
	username: string;
	createdBy: number;
	createdTime: Date;
	updatedTime: Date;
	votes: number;
	userVote: number;
	userBookmarked: boolean;
};
export type ArmyGuide = {
	id: number;
	textContent: string | null;
	youtubeUrl: string | null;
	createdTime: Date;
	updatedTime: Date;
};
export type ArmyComment = {
	id: number;
	comment: string;
	replyTo: number | null;
	username: string;
	createdBy: number;
	createdTime: Date;
	updatedTime: Date;
};
export type ArmyUnit = {
	id: number;
	unitId: number;
	home: UnitHome;
	amount: number;
};
export type ArmyEquipment = {
	id: number;
	equipmentId: number;
};
export type ArmyPet = {
	id: number;
	petId: number;
	hero: HeroType;
};

export type StructuredArmyComment = ArmyComment & {
	replies: StructuredArmyComment[];
};

export class ArmyModel {
	public gameData: StaticGameData;

	/**
	 * Corresponding id in the armies table.
	 * May be undefined if not saved yet.
	 */
	public id?: number;
	public username?: string;
	public createdBy?: number;
	public createdTime?: Date;
	public updatedTime?: Date;

	public name = $state<string | null>(null);
	public townHall = $state(17);
	public units = $state<UnitModel[]>([]);
	public ccUnits = $state<UnitModel[]>([]);
	public pets = $state<PetModel[]>([]);
	public equipment = $state<EquipmentModel[]>([]);
	public guide = $state<GuideModel | null>(null);
	public tags = $state<string[]>([]);
	public banner = $state(BANNERS[Math.floor(Math.random() * BANNERS.length)]);
	public comments = $state<CommentModel[]>([]);
	public structuredComments = $state<StructuredArmyComment[]>([]);
	public votes = $state(0);
	public userVote = $state(0);
	public userBookmarked = $state(false);

	constructor(gameData: StaticGameData, data?: Partial<Army>) {
		this.gameData = gameData;

		// Set initial data. Normally I'd like to `this.foo = initial ?? default` but the default has
		// to be in the property declaration otherwise the $state becomes `| undefined` which is annoying.
		// Of course you could duplicate defaults again in constructor but that may just be confusing?

		this.id = data?.id;
		this.username = data?.username;
		this.createdBy = data?.createdBy;
		this.createdTime = data?.createdTime;
		this.updatedTime = data?.updatedTime;
		if (data?.name) {
			this.name = data.name;
		}
		if (data?.townHall) {
			this.townHall = data.townHall;
		}
		if (data?.units) {
			for (const unit of data.units) {
				const model = new UnitModel(this.gameData, unit);
				if (unit.home === 'armyCamp') {
					this.units.push(model);
				} else if (unit.home === 'clanCastle') {
					this.ccUnits.push(model);
				} else {
					throw new Error(`Unit home "${unit.home}" is not implemented`);
				}
			}
		}
		if (data?.pets) {
			for (const pet of data.pets) {
				const model = new PetModel(this.gameData, pet);
				this.pets.push(model);
			}
		}
		if (data?.equipment) {
			for (const equipment of data.equipment) {
				const model = new EquipmentModel(this.gameData, equipment);
				this.equipment.push(model);
			}
		}
		if (data?.guide) {
			this.guide = new GuideModel(this.gameData, data?.guide ?? undefined);
		}
		if (data?.tags) {
			this.tags = data?.tags;
		}
		if (data?.comments) {
			for (const comment of data.comments) {
				const model = new CommentModel(this.gameData, comment);
				this.comments.push(model);
			}
			this.structuredComments = CommentModel.structureComments(this.comments);
		}
		if (data?.banner) {
			this.banner = data.banner;
		}
		if (data?.votes !== undefined) {
			this.votes = data.votes;
		}
		if (data?.userVote !== undefined) {
			this.userVote = data.userVote;
		}
		if (data?.userBookmarked !== undefined) {
			this.userBookmarked = data.userBookmarked;
		}
	}

	public getSaveData() {
		return {
			id: this.id,
			name: this.name,
			townHall: this.townHall,
			units: this.allUnits.map((unit) => unit.getSaveData()),
			pets: this.pets.map((pet) => pet.getSaveData()),
			equipment: this.equipment.map((equipment) => equipment.getSaveData()),
			guide: this.guide ? this.guide.getSaveData() : null,
			tags: this.tags,
			banner: this.banner,
		};
	}

	public get allUnits() {
		return [...this.units, ...this.ccUnits];
	}

	public get capacity() {
		const { troopCapacity, spellCapacity, siegeCapacity } = this.thData;
		return { troops: troopCapacity, spells: spellCapacity, sieges: siegeCapacity };
	}

	public get ccCapacity() {
		const { ccTroopCapacity, ccSpellCapacity, ccSiegeCapacity } = this.thData;
		return { troops: ccTroopCapacity, spells: ccSpellCapacity, sieges: ccSiegeCapacity };
	}

	public get housingSpaceUsed() {
		return UnitModel.getTotals(this.units);
	}

	public get ccHousingSpaceUsed() {
		return UnitModel.getTotals(this.ccUnits);
	}

	public get thData() {
		return ArmyModel.requireTownHall(this.townHall, this.gameData);
	}

	public addUnit(unit: Unit, home: UnitHome, amount = 1) {
		const newUnit = new UnitModel(this.gameData, { unitId: unit.id, amount, home });
		const units = home === 'clanCastle' ? this.ccUnits : this.units;
		units.push(newUnit);
		return newUnit;
	}

	public addPet(pet: Pet, hero: HeroType) {
		const newPet = new PetModel(this.gameData, { hero, petId: pet.id });
		this.pets.push(newPet);
		return newPet;
	}

	public addEquipment(equipment: Equipment) {
		const newEquipment = new EquipmentModel(this.gameData, { equipmentId: equipment.id });
		this.equipment.push(newEquipment);
		return newEquipment;
	}

	public addGuide() {
		this.guide = new GuideModel(this.gameData);
		return this.guide;
	}

	public decrementUnitAmount(name: string, housedIn: UnitHome) {
		const units = housedIn === 'clanCastle' ? this.ccUnits : this.units;
		const idx = units.findIndex((unit) => unit.info.name === name);
		if (idx === -1) {
			throw new Error(`Unit "${name}" does not exist in this army`);
		}
		if (units[idx].amount === 1) {
			units.splice(idx, 1);
		} else {
			units[idx].amount -= 1;
		}
	}

	public remove(name: string, housedIn: UnitHome) {
		const units = housedIn === 'clanCastle' ? this.ccUnits : this.units;
		const idx = units.findIndex((unit) => unit.info.name === name);
		if (idx === -1) {
			throw new Error(`Unit "${name}" does not exist in this army`);
		}
		units.splice(idx, 1);
	}

	public removePet(name: string) {
		const idx = this.pets.findIndex((p) => p.info.name === name);
		if (idx === -1) {
			throw new Error(`Pet "${name}" does not exist in this army`);
		}
		this.pets.splice(idx, 1);
	}

	public removeEquipment(name: string) {
		const idx = this.equipment.findIndex((p) => p.info.name === name);
		if (idx === -1) {
			throw new Error(`Equipment "${name}" does not exist in this army`);
		}
		this.equipment.splice(idx, 1);
	}

	public replacePet(name: string, replaceOnHero: HeroType) {
		const selectedPet = this.pets.find((p) => p.info.name === name);
		if (!selectedPet) {
			throw new Error(`Pet "${name}" does not exist in this army`);
		}
		selectedPet.hero = replaceOnHero;
	}

	public removeGuide() {
		this.guide = null;
	}

	public hasHero(hero: HeroType) {
		if (this.equipment.find((eq) => eq.info.hero === hero)) {
			return true;
		}
		if (this.pets.find((pet) => pet.hero === hero)) {
			return true;
		}
		return false;
	}

	public getStats() {
		return {
			type: this.getArmyType(),
			hasClanCastle: this.ccUnits.length > 0,
			hasHeroes: VALID_HEROES.some((hero) => this.hasHero(hero)),
			hasGuide: this.guide !== null,
		};
	}

	private getArmyType() {
		let airTotal = 0;
		let groundTotal = 0;

		// Do we want to exclude clan castle units?
		for (const unit of this.allUnits) {
			if (unit.info.type === 'Spell') {
				continue;
			}
			const weight = unit.amount * unit.info.housingSpace;
			if (unit.info.isFlying) {
				airTotal += weight;
			} else {
				groundTotal += weight;
			}
		}

		// 0 is possible if for some reason user just made a spell-only army (not recommended...)
		const total = airTotal + groundTotal;
		const airRatio = total === 0 ? 0 : airTotal / total;

		// Type is air or ground if stat dominates by more than 60%
		if (airRatio > 0.6) return 'Air';
		if (airRatio < 0.4) return 'Ground';
		return 'Hybrid';
	}

	public static getMaxHeroLevel(hero: HeroType, townHall: number, gameData: StaticGameData) {
		const thData = ArmyModel.requireTownHall(townHall, gameData);
		if (!VALID_HEROES.includes(hero)) {
			return -1;
		}
		if (hero === 'Barbarian King') {
			return thData.maxBarbarianKing ?? -1;
		}
		if (hero === 'Archer Queen') {
			return thData.maxArcherQueen ?? -1;
		}
		if (hero === 'Grand Warden') {
			return thData.maxGrandWarden ?? -1;
		}
		if (hero === 'Royal Champion') {
			return thData.maxRoyalChampion ?? -1;
		}
		if (hero === 'Minion Prince') {
			return thData.maxMinionPrince ?? -1;
		}
		// Should never happen?
		return -1;
	}

	public static requireTownHall(level: number, gameData: StaticGameData) {
		const th = gameData.townHalls.find((th) => th.level === level);
		if (!th) {
			throw new Error(`Expected town hall ${level}`);
		}
		return th;
	}
}
