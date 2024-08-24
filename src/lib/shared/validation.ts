import type { SaveArmy, TownHall, Unit, Equipment, Pet, SaveUnit, SaveEquipment, SavePet, SaveGuide } from './types';
import {
	BANNERS,
	VALID_UNIT_HOME,
	VALID_HEROES,
	getTotals,
	getUnitLevel,
	getCcUnitLevel,
	getHeroLevel,
	getEquipmentLevel,
	getPetLevel,
	requireTh,
	requireUnit,
	requireEquipment,
	requirePet,
	GUIDE_TEXT_CHAR_LIMIT,
} from './utils';
import { checkGuideEditorSchema } from './guideEditor';
import z from 'zod';

export const numberSchema = z.number().int().positive();
export const unitSchema = z.object({
	id: numberSchema.optional(),
	unitId: numberSchema,
	home: z.enum(VALID_UNIT_HOME),
	amount: numberSchema,
});
export const equipmentSchema = z.object({
	id: numberSchema.optional(),
	equipmentId: numberSchema,
});
export const petSchema = z.object({
	id: numberSchema.optional(),
	petId: numberSchema,
	hero: z.enum(VALID_HEROES),
});
export const guideSchema = z.object({
	id: numberSchema.optional(),
	textContent: z.string().min(5).max(GUIDE_TEXT_CHAR_LIMIT).nullable(),
	youtubeUrl: z.string().min(1).max(75).nullable(),
});
export const armySchema = z.object({
	id: numberSchema.optional(),
	name: z.string().min(2).max(25),
	townHall: numberSchema,
	banner: z.enum(BANNERS),
	units: z.array(unitSchema).nonempty(),
	equipment: z.array(equipmentSchema),
	pets: z.array(petSchema),
	guide: guideSchema.optional(),
});

export type Ctx = { townHalls: TownHall[]; units: Unit[]; equipment: Equipment[]; pets: Pet[] };

/**
 * Validates data for so it conforms to the `SaveArmy` type.
 * Also validates business logic rules such as making sure units are unlocked for the town hall etc...
 */
export function validateArmy(data: unknown, ctx: Ctx): SaveArmy {
	const army = armySchema.parse(data);

	const units = army.units.filter((unit) => unit.home === 'armyCamp');
	const ccUnits = army.units.filter((unit) => unit.home === 'clanCastle');
	const equipment = army.equipment;
	const pets = army.pets;

	validateUnits(units, army.townHall, ctx);
	validateCcUnits(ccUnits, army.townHall, ctx);
	validateEquipment(equipment, army.townHall, ctx);
	validatePets(pets, army.townHall, ctx);
	validateGuide(army.guide);

	return army;
}

export function validateUnits(units: SaveUnit[], townHall: number, ctx: Pick<Ctx, 'units' | 'townHalls'>) {
	const thData = requireTh(townHall, ctx);
	const unitsData = units.map((u) => ({ ...requireUnit(u.unitId, ctx), amount: u.amount }));

	// Check for duplicate units
	const duplicateUnits = findDuplicateUnits(units);
	if (duplicateUnits.length) {
		const unitData = requireUnit(duplicateUnits[0], ctx);
		throw new Error(`Duplicate unit "${unitData.name}" found`);
	}

	// Check totals don't overflow max town hall capacity
	const totals = getTotals(unitsData);
	if (totals.troops > thData.troopCapacity) {
		throw new Error(`Town hall ${thData.level} has a max troop capacity of ${thData.troopCapacity}, but this army exceeded that with ${totals.troops}`);
	}
	if (totals.spells > thData.spellCapacity) {
		throw new Error(`Town hall ${thData.level} has a max spell capacity of ${thData.spellCapacity}, but this army exceeded that with ${totals.spells}`);
	}
	if (totals.sieges > thData.siegeCapacity) {
		throw new Error(`Town hall ${thData.level} has a max siege machine capacity of ${thData.siegeCapacity}, but this army exceeded that with ${totals.sieges}`);
	}

	// Check we haven't exceeded the super limit (max 2 unique super troops per army)
	if (unitsData.filter((u) => u.isSuper).length > 2) {
		throw new Error(`An army can have a maximum of two unique super troops`);
	}

	// Check units can all be selected
	for (const unit of unitsData) {
		if (getUnitLevel(unit.name, unit.type, { ...ctx, th: thData }) === -1) {
			throw new Error(`Unit "${unit.name}" isn't available at town hall ${townHall}`);
		}
	}
}

export function validateCcUnits(ccUnits: SaveUnit[], townHall: number, ctx: Pick<Ctx, 'units' | 'townHalls'>) {
	const thData = requireTh(townHall, ctx);
	const ccUnitsData = ccUnits.map((u) => ({ ...requireUnit(u.unitId, ctx), amount: u.amount }));

	// Check for duplicate clan castle units
	const duplicateCcUnits = findDuplicateUnits(ccUnits);
	if (duplicateCcUnits.length) {
		const unitData = requireUnit(duplicateCcUnits[0], ctx);
		throw new Error(`Duplicate clan castle unit "${unitData.name}" found`);
	}

	// Check clan castle totals don't overflow max town hall cc capacity
	const ccTotals = getTotals(ccUnitsData);
	if (ccTotals.troops > thData.ccTroopCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max clan castle troop capacity of ${thData.ccTroopCapacity}, but this army exceeded that with ${ccTotals.troops}`
		);
	}
	if (ccTotals.spells > thData.ccSpellCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max clan castle spell capacity of ${thData.ccSpellCapacity}, but this army exceeded that with ${ccTotals.spells}`
		);
	}
	if (ccTotals.sieges > thData.ccSiegeCapacity) {
		throw new Error(
			`Town hall ${thData.level} has a max clan castle siege machine capacity of ${thData.ccSiegeCapacity}, but this army exceeded that with ${ccTotals.sieges}`
		);
	}

	// Check clan castle units can all be selected
	for (const unit of ccUnitsData) {
		if (getCcUnitLevel(unit.name, unit.type, { ...ctx, th: thData }) === -1) {
			throw new Error(`Clan castle unit "${unit.name}" isn't available at town hall ${townHall}`);
		}
	}
}

export function validateEquipment(equipment: SaveEquipment[], townHall: number, ctx: Pick<Ctx, 'equipment' | 'townHalls'>) {
	const thData = requireTh(townHall, ctx);
	const equipmentData = equipment.map((eq) => requireEquipment(eq.equipmentId, ctx));
	const heroToEquipment: Record<string, string[]> = {};

	for (const eq of equipmentData) {
		const hero = eq.hero.toLowerCase();
		const stashedEquipment = heroToEquipment[eq.hero] ?? [];
		if (stashedEquipment.includes(eq.name)) {
			throw new Error(`Duplicate equipment "${eq.name}" on ${hero}`);
		}
		if (stashedEquipment.length === 2) {
			throw new Error(`Hero ${hero} cannot have more than two pieces of equipment`);
		}
		if (getHeroLevel(eq.hero, { th: thData }) === -1) {
			throw new Error(`Equipment "${eq.name}" can't be used as the ${hero} isn't unlocked at town hall ${townHall}`);
		}
		if (getEquipmentLevel(eq.name, { ...ctx, th: thData }) === -1) {
			throw new Error(`Equipment "${eq.name}" isn't available at town hall ${townHall}`);
		}
		heroToEquipment[eq.hero] = [...stashedEquipment, eq.name];
	}
}

export function validatePets(pets: SavePet[], townHall: number, ctx: Pick<Ctx, 'pets' | 'townHalls'>) {
	const thData = requireTh(townHall, ctx);
	const petsData = pets.map((p) => ({ ...requirePet(p.petId, ctx), hero: p.hero }));
	const heroToPets: Record<string, string[]> = {};

	for (const pet of petsData) {
		const hero = pet.hero.toLowerCase();
		const stashedPets = heroToPets[pet.hero] ?? [];
		if (stashedPets.length === 1) {
			throw new Error(`Hero ${hero} cannot have more than one pet`);
		}
		if (
			Object.values(heroToPets)
				.flatMap((p) => p)
				.includes(pet.name)
		) {
			throw new Error(`Pet "${pet.name}" has already been assigned to another hero`);
		}
		if (getHeroLevel(pet.hero, { th: thData }) === -1) {
			throw new Error(`Pet "${pet.name}" can't be used as the ${hero} isn't unlocked at town hall ${townHall}`);
		}
		if (getPetLevel(pet.name, { ...ctx, th: thData }) === -1) {
			throw new Error(`Pet "${pet.name}" isn't available at town hall ${townHall}`);
		}
		heroToPets[pet.hero] = [...stashedPets, pet.name];
	}
}

function validateGuide(guide?: SaveGuide) {
	if (!guide) return;

	const { textContent, youtubeUrl } = guide;

	if (!textContent && !youtubeUrl) {
		throw new Error('Guide must have at least either text content or youtube video link');
	}

	if (textContent) {
		checkGuideEditorSchema(textContent);
	}

	if (youtubeUrl) {
		// Validate YouTube URL
		const youtubeUrlRegex = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;
		if (!youtubeUrlRegex.test(youtubeUrl)) {
			throw new Error('Guide has an invalid YouTube URL');
		}
	}
}

function findDuplicateUnits(units: SaveUnit[]) {
	const seen = new Set<number>();
	const duplicates = new Set<number>();
	for (const obj of units) {
		if (seen.has(obj.unitId)) {
			duplicates.add(obj.unitId);
		} else {
			seen.add(obj.unitId);
		}
	}
	return Array.from(duplicates);
}
