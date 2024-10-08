import type { SvelteComponent } from 'svelte';
import { BANNERS, VALID_UNIT_HOME, VALID_HEROES } from '$shared/utils';

export type SvelteComponentGeneric = typeof SvelteComponent<Record<string, unknown>>;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type Modal<T = unknown> = {
	/** An ID is autogenerated when calling `openModal` */
	id: number;
	/**
	 * The component that is rendered.
	 * This component should be wrapped in <C.Modal> ... </C.Modal>
	 */
	component: SvelteComponentGeneric;
	/**
	 * Props passed to the component.
	 * A `close` function prop is also always given for a way to close the modal.
	 * If the modal was opened using `openModalAsync`, the value passed to `close` will be the resolved value of the promise.
	 */
	props: Record<string, unknown> & {
		close(rtn?: T): void;
	};
};

export type Notification = {
	/** An ID is autogenerated when calling `notify` */
	id: number;
	opts: {
		/** Notification title */
		title: string;
		/** Notification description */
		description: string;
		/** Notification theme @default 'primary' */
		theme?: 'primary' | 'success' | 'failure';
		/** How long the notification will show for (in ms) @default 1000ms */
		duration?: number;
	};
	/** Function that dismisses the notification */
	dismiss(): void;
};

export type User = {
	id: number;
	// Only included if user is requesting his own data
	googleId?: string;
	username: string;
	roles: string[];
	playerTag: string | null;
	level: number | null;
};

export type Session = {
	id: string;
	userId: number;
	expiresAt: Date;
};

export type TownHall = {
	level: number;
	maxBarracks: number;
	maxDarkBarracks: number | null;
	maxLaboratory: number | null;
	maxSpellFactory: number | null;
	maxDarkSpellFactory: number | null;
	maxWorkshop: number | null;
	maxCc: number | null;
	maxBlacksmith: number | null;
	maxPetHouse: number | null;
	maxBarbarianKing: number | null;
	maxArcherQueen: number | null;
	maxGrandWarden: number | null;
	maxRoyalChampion: number | null;
	troopCapacity: number;
	spellCapacity: number;
	siegeCapacity: number;
	ccLaboratoryCap: number;
	ccTroopCapacity: number;
	ccSpellCapacity: number;
	ccSiegeCapacity: number;
};

export type UnitType = 'Troop' | 'Siege' | 'Spell';
export type UnitHome = (typeof VALID_UNIT_HOME)[number];
export type HeroType = (typeof VALID_HEROES)[number];

export type BlackSmithLevel = {
	id: number;
	level: number;
	maxCommon: number;
	maxEpic: number;
};
export type UnitLevel = {
	id: number;
	unitId: number;
	level: number;
	spellFactoryLevel: number | null;
	barrackLevel: number | null;
	laboratoryLevel: number | null;
};
export type EquipmentLevel = {
	equipmentId: number;
	level: number;
	blacksmithLevel: number | null;
};
export type PetLevel = {
	id: number;
	petId: number;
	level: number;
	petHouseLevel: number | null;
};

export type Unit = {
	/** ID of the unit in the `units` table */
	id: number;
	type: UnitType;
	name: string;
	objectId: number;
	housingSpace: number;
	trainingTime: number;
	productionBuilding: string;
	isSuper: boolean;
	isFlying: boolean;
	isJumper: boolean;
	airTargets: boolean;
	groundTargets: boolean;
	levels: UnitLevel[];
};
export type Equipment = {
	/** ID of the hero equipment in the `equipment` table */
	id: number;
	/** Which hero this equipment can be applied to */
	hero: HeroType;
	name: string;
	epic: boolean;
	levels: EquipmentLevel[];
};
export type Pet = {
	/** ID of the pet in the `pets` table */
	id: number;
	name: string;
	levels: PetLevel[];
};
export type Guide = {
	/** ID of the guide in the `army_guides` table */
	id: number;
	armyId: number;
	textContent: string | null;
	youtubeUrl: string | null;
	createdTime: Date;
	updatedTime: Date;
};

/**
 * The following `SaveFoo` types are the bare minimum data required for army creation/saving
 */
export type SaveUnit = {
	id?: number;
	/** ID of the unit in the `units` table */
	unitId: number;
	home: UnitHome;
	amount: number;
};
export type SaveEquipment = {
	id?: number;
	/** ID of the equipment in the `equipment` table */
	equipmentId: number;
};
export type SavePet = {
	id?: number;
	/** ID of the pet in the `pets` table */
	petId: number;
	hero: HeroType;
};
export type SaveGuide = Optional<Omit<Guide, 'createdTime' | 'updatedTime' | 'armyId'>, 'id'>;

/**
 * The following `ArmyFoo` types is the complete data `getArmy` will return for convenience
 */
export type ArmyUnit = (SaveUnit & Omit<Unit, 'levels'>) & {
	/** ID of the unit in the `army_units` table */
	id: number;
};
export type ArmyEquipment = (SaveEquipment & Omit<Equipment, 'levels'>) & {
	/** ID of the equipment in the `army_equipment` table */
	id: number;
};
export type ArmyPet = (SavePet & Omit<Pet, 'levels'>) & {
	/** ID of the pet in the `army_pets` table */
	id: number;
};
export type ArmyGuide = SaveGuide & {
	/** ID of the guide in the `army_guides` table */
	id: number;
};

/** The bare minimum data required for army creation/saving */
export type SaveArmy = {
	/** If this is defined, we are saving an existing army, else we are creating a new army */
	id?: number;
	name: string;
	townHall: number;
	banner: Banner;
	units: SaveUnit[];
	equipment: SaveEquipment[];
	pets: SavePet[];
	guide: SaveGuide | null;
};
/** A complete saved army, as returned by `getArmy` */
export type Army = Omit<SaveArmy, 'units' | 'equipment' | 'pets' | 'guide'> & {
	/** ID is now required */
	id: number;
	units: ArmyUnit[];
	equipment: ArmyEquipment[];
	pets: ArmyPet[];
	guide: ArmyGuide | null;
	comments: Comment[];
	createdBy: number;
	createdTime: Date;
	updatedTime: Date;
	votes: number;
	username: string;
	userVote: number;
	userBookmarked: boolean;
};

export type Totals = {
	troops: number;
	sieges: number;
	spells: number;
	time: number;
};

export type SaveComment = {
	id?: number;
	armyId: number;
	comment: string;
	replyTo: number | null;
};

export type Comment = SaveComment & {
	id: number;
	username: string;
	createdBy: number;
	createdTime: Date;
	updatedTime: Date;
};

export type StructuredComment = Comment & {
	replies: Comment[];
};

type UserUtils = {
	/**
	 * Returns true if user has every role specified.
	 */
	hasRoles: (...roles: string[]) => boolean;
};

export type AppState = {
	// Frequently used data (cache)
	units: Unit[];
	townHalls: TownHall[];
	equipment: Equipment[];
	pets: Pet[];
	user: (User & UserUtils) | null;
	// Modals
	modals: Modal[];
	openModal<T = unknown>(component: Modal['component'], props?: Record<string, unknown>, onClose?: (rtnValue?: T) => void): void;
	openModalAsync<T = unknown>(component: Modal['component'], props?: Record<string, unknown>): Promise<T | undefined>;
	// Notifications
	notifications: Notification[];
	notify(opts: Notification['opts']): void;
	// Confirm
	confirm(confirmText: string): Promise<boolean>;
};

export type Banner = (typeof BANNERS)[number];

export type FetchErrors = Record<string | number | symbol, string[] | undefined> | string;
